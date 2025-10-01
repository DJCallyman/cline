import { Anthropic } from "@anthropic-ai/sdk"
import { ModelInfo } from "@shared/api"
import { veniceModels } from "@shared/models/venice"
import OpenAI from "openai"
import { ApiHandler, CommonApiHandlerOptions } from "../index"
import { withRetry } from "../retry"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"

interface VeniceHandlerOptions extends CommonApiHandlerOptions {
	veniceApiKey?: string
	apiModelId?: string
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

		const stream = await client.chat.completions.create({
			model: model.id,
			messages: openAiMessages,
			stream: true,
			stream_options: { include_usage: true },
		})

		for await (const chunk of stream) {
			if (chunk.choices[0]?.delta?.content) {
				yield {
					type: "text",
					text: chunk.choices[0].delta.content,
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
		const modelId = this.options.apiModelId
		if (modelId && modelId in veniceModels) {
			return { id: modelId, info: veniceModels[modelId as keyof typeof veniceModels] }
		}
		const defaultModel = "venice-uncensored" as const
		return {
			id: defaultModel,
			info: veniceModels[defaultModel],
		}
	}
}
