import { ModelInfo } from "@shared/api"

export type VeniceModelId = "qwen3-235b" | "mistral-31-24b" | "qwen3-4b" | "venice-uncensored"

export const veniceModels: Record<VeniceModelId, ModelInfo> = {
	"qwen3-235b": {
		maxTokens: 32768,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.9,
		outputPrice: 4.5,
		description: "Venice Large 1.1 - Most powerful flagship model with advanced reasoning capabilities",
	},
	"mistral-31-24b": {
		maxTokens: 32768,
		contextWindow: 131072,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0.5,
		outputPrice: 2.0,
		description: "Venice Medium (3.1) - Vision + function calling",
	},
	"qwen3-4b": {
		maxTokens: 8192,
		contextWindow: 40960,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.05,
		outputPrice: 0.15,
		description: "Venice Small - Fast, affordable for most tasks",
	},
	"venice-uncensored": {
		maxTokens: 8192,
		contextWindow: 32768,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.2,
		outputPrice: 0.9,
		description: "Venice Uncensored 1.1 - No content filtering",
	},
}
