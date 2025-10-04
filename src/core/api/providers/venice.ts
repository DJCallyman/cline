import { Anthropic } from "@anthropic-ai/sdk"
import { ModelInfo, veniceModels } from "@shared/api"
import OpenAI from "openai"
import { ApiHandler, CommonApiHandlerOptions } from "../index"
import { withRetry } from "../retry"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"

interface VeniceHandlerOptions extends CommonApiHandlerOptions {
	veniceApiKey?: string
	veniceModelId?: string
	veniceModelInfo?: ModelInfo
	veniceEnableWebSearch?: "auto" | "on" | "off"
	veniceIncludeSearchResultsInStream?: boolean
	veniceIncludeVeniceSystemPrompt?: boolean
	veniceStripThinkingResponse?: boolean
	veniceDisableThinking?: boolean
}

export class VeniceHandler implements ApiHandler {
	private options: VeniceHandlerOptions
	private client: OpenAI | undefined

	constructor(options: VeniceHandlerOptions) {
		this.options = options
	}

	private ensureClient(): OpenAI {
		if (!this.client) {
			if (!this.options.veniceApiKey) {
				throw new Error("Venice API key is required")
			}
			try {
				this.client = new OpenAI({
					baseURL: "https://api.venice.ai/api/v1",
					apiKey: this.options.veniceApiKey,
				})
			} catch (error: any) {
				throw new Error(`Error creating Venice client: ${error.message}`)
			}
		}
		return this.client
	}

	@withRetry()
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const client = this.ensureClient()
		const model = this.getModel()

		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		// Build Venice parameters
		const veniceParameters: Record<string, any> = {}

		// Web search configuration
		if (this.options.veniceEnableWebSearch !== undefined) {
			veniceParameters.enable_web_search = this.options.veniceEnableWebSearch
		}

		// Include search results in stream (only if web search is not "off")
		if (this.options.veniceIncludeSearchResultsInStream !== undefined && this.options.veniceEnableWebSearch !== "off") {
			veniceParameters.include_search_results_in_stream = this.options.veniceIncludeSearchResultsInStream
		}

		// Include Venice system prompt
		if (this.options.veniceIncludeVeniceSystemPrompt !== undefined) {
			veniceParameters.include_venice_system_prompt = this.options.veniceIncludeVeniceSystemPrompt
		}

		// Thinking controls for reasoning models
		if (this.supportsReasoning()) {
			if (this.options.veniceStripThinkingResponse !== undefined) {
				veniceParameters.strip_thinking_response = this.options.veniceStripThinkingResponse
			}
			if (this.options.veniceDisableThinking !== undefined) {
				veniceParameters.disable_thinking = this.options.veniceDisableThinking
			}
		}

		// Create request body with Venice parameters
		const requestBody: any = {
			model: model.id,
			messages: openAiMessages,
			stream: true,
			stream_options: { include_usage: true },
		}

		// Add Venice parameters if any are set
		if (Object.keys(veniceParameters).length > 0) {
			requestBody.venice_parameters = veniceParameters
		}

		const stream = (await client.chat.completions.create(requestBody)) as any

		for await (const chunk of stream) {
			if (chunk.choices[0]?.delta?.content) {
				yield {
					type: "text",
					text: chunk.choices[0].delta.content,
				}
			}

			// Handle search results if included in stream
			if ((chunk as any).search_results) {
				yield {
					type: "text",
					text: `\n\n**Search Results:**\n${JSON.stringify((chunk as any).search_results, null, 2)}\n\n`,
				}
			}

			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
					cacheWriteTokens: 0,
					cacheReadTokens: chunk.usage.prompt_tokens_details?.cached_tokens || 0,
					totalCost: 0, // Pricing would need to be configured
				}
			}
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		const modelId = this.options.veniceModelId
		if (modelId && modelId in veniceModels) {
			return { id: modelId, info: veniceModels[modelId as keyof typeof veniceModels] }
		}
		// Use model info if available
		if (this.options.veniceModelInfo && this.options.veniceModelId) {
			return { id: this.options.veniceModelId, info: this.options.veniceModelInfo }
		}
		const defaultModel = "venice-uncensored" as const
		return {
			id: defaultModel,
			info: veniceModels[defaultModel],
		}
	}

	/**
	 * Checks if the current model supports vision/images
	 */
	supportsImages(): boolean {
		const model = this.getModel()
		// mistral-31-24b is the only Venice model that supports vision
		return model.id === "mistral-31-24b" || model.info.supportsImages === true
	}

	/**
	 * Checks if the current model supports function calling/tools
	 */
	supportsTools(): boolean {
		const model = this.getModel()
		// Venice models that support function calling based on API docs
		const functionCallingModels = ["qwen3-235b", "qwen3-4b", "mistral-31-24b", "venice-uncensored"]
		return functionCallingModels.includes(model.id)
	}

	/**
	 * Checks if the current model supports web search
	 */
	supportsWebSearch(): boolean {
		// All Venice text models support web search
		return true
	}

	/**
	 * Checks if the current model supports reasoning mode
	 */
	supportsReasoning(): boolean {
		const model = this.getModel()
		// Venice reasoning models based on API docs
		const reasoningModels = ["qwen3-4b", "qwen3-235b"]
		return reasoningModels.includes(model.id)
	}

	/**
	 * Checks if the current model supports structured responses (JSON schema)
	 */
	supportsStructuredResponses(): boolean {
		const model = this.getModel()
		// Models that support response_format with JSON schema
		const structuredResponseModels = ["venice-uncensored", "qwen3-235b", "qwen3-4b", "mistral-31-24b"]
		return structuredResponseModels.includes(model.id)
	}
}
