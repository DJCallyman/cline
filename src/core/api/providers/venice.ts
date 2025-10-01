import { Anthropic } from "@anthropic-ai/sdk"
import { ModelInfo, veniceModels } from "@shared/api"
import OpenAI from "openai"
import { Logger } from "../../../services/logging/Logger"
import { ApiHandler, CommonApiHandlerOptions } from "../index"
import { withRetry } from "../retry"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream, ApiStreamUsageChunk } from "../transform/stream"

interface VeniceClientConfig {
	baseUrl: string
	apiKey: string
	stripThinkingResponse: boolean
	disableThinking: boolean
	modelId: string
}

interface VeniceHandlerOptions extends CommonApiHandlerOptions {
	veniceApiKey?: string
	veniceBaseUrl?: string
	stripThinkingResponse?: boolean
	disableThinking?: boolean
	apiModelId?: string
}

export class VeniceHandler implements ApiHandler {
	private readonly config: VeniceClientConfig
	private readonly options: VeniceHandlerOptions

	constructor(options: VeniceHandlerOptions) {
		this.options = options
		this.config = {
			baseUrl: options.veniceBaseUrl || "https://api.venice.ai/api/v1",
			apiKey: options.veniceApiKey || "",
			stripThinkingResponse: options.stripThinkingResponse || false,
			disableThinking: options.disableThinking || false,
			modelId: options.apiModelId || "venice-uncensored",
		}

		if (!this.config.apiKey) {
			throw new Error("Venice API key is required")
		}
	}

	@withRetry()
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		// Convert Anthropic messages to OpenAI format
		let openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = convertToOpenAiMessages(messages)

		// Add system prompt if provided
		if (systemPrompt) {
			openAiMessages = [
				{
					role: "system",
					content: systemPrompt,
				},
				...openAiMessages,
			]
		}

		// Validate we have messages to send
		if (!openAiMessages || openAiMessages.length === 0) {
			throw new Error("No messages provided to Venice API")
		}

		const requestBody = {
			messages: openAiMessages,
			model: this.config.modelId,
			stream: true,
			venice_parameters: {
				strip_thinking_response: this.config.stripThinkingResponse,
				disable_thinking: this.config.disableThinking,
			},
		}

		Logger.log(`Making Venice API request to ${this.config.baseUrl}/chat/completions with model ${this.config.modelId}`)

		const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.config.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		})

		if (!response.ok) {
			const errorText = await response.text()
			Logger.error(`Venice API error response: ${errorText}`)
			throw new Error(`Venice API error: ${response.status} ${response.statusText} - ${errorText}`)
		}

		if (!response.body) {
			Logger.error("Venice API returned no response body")
			throw new Error("No response body from Venice API")
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let buffer = ""

		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) {
					break
				}

				const chunk = decoder.decode(value, { stream: true })
				buffer += chunk

				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const data = line.slice(6).trim()
						if (data === "[DONE]") {
							continue
						}

						try {
							const parsed = JSON.parse(data)
							if (parsed.choices?.[0]?.delta?.content) {
								yield {
									type: "text",
									text: parsed.choices[0].delta.content,
								}
							}
							if (parsed.usage) {
								const inputTokens = parsed.usage.prompt_tokens || 0
								const outputTokens = parsed.usage.completion_tokens || 0
								const modelInfo = this.getModel().info
								const inputCost = (inputTokens * (modelInfo.inputPrice || 0)) / 1_000_000
								const outputCost = (outputTokens * (modelInfo.outputPrice || 0)) / 1_000_000
								const totalCost = inputCost + outputCost

								yield {
									type: "usage",
									inputTokens,
									outputTokens,
									totalCost,
								}
							}
						} catch (e) {
							Logger.error(`Error parsing Venice response: ${e}`)
						}
					}
				}
			}
		} finally {
			reader.releaseLock()
		}
	}

	@withRetry()
	async getModels(): Promise<{ id: string; info: ModelInfo }[]> {
		const response = await fetch(`${this.config.baseUrl}/models`, {
			headers: {
				Authorization: `Bearer ${this.config.apiKey}`,
			},
		})

		if (!response.ok) {
			throw new Error(`Failed to fetch Venice models: ${response.status}`)
		}

		const data = await response.json()
		return data.data.map((model: any) => ({
			id: model.id,
			info: {
				maxTokens: model.model_spec?.availableContextTokens || 8192,
				contextWindow: model.model_spec?.availableContextTokens || 128000,
				supportsImages: model.type === "text" && model.model_spec?.capabilities?.supportsVision,
				supportsPromptCache: false,
				inputPrice: model.model_spec?.pricing?.input?.diem || 0,
				outputPrice: model.model_spec?.pricing?.output?.diem || 0,
				description: model.model_spec?.name || model.id,
			},
		}))
	}

	getModel(): { id: string; info: ModelInfo } {
		// Return the model info for the currently selected model
		const modelInfo = (veniceModels as any)[this.config.modelId] || veniceModels["venice-uncensored"]
		return {
			id: this.config.modelId,
			info: modelInfo,
		}
	}

	async getApiStreamUsage(): Promise<ApiStreamUsageChunk | undefined> {
		// Venice doesn't provide a separate generation details endpoint
		// Usage is already streamed in the main response
		return undefined
	}
}
