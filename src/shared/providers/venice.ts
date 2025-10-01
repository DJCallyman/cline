import type { ModelInfo } from "@shared/api"

export const veniceModels: Record<string, ModelInfo> = {
	"venice-uncensored": {
		contextWindow: 131072,
		maxTokens: 4096,
		inputPrice: 0.0001,
		outputPrice: 0.0001,
		supportsPromptCache: true,
		thinkingConfig: {
			maxBudget: 4096,
		},
		supportsGlobalEndpoint: true,
		cacheWritesPrice: 0.00001,
		cacheReadsPrice: 0.00001,
		description: "A powerful general-purpose model with unrestricted responses",
	},
	"llama-3.3-70b": {
		contextWindow: 131072,
		maxTokens: 4096,
		inputPrice: 0.0001,
		outputPrice: 0.0001,
		supportsPromptCache: true,
		thinkingConfig: {
			maxBudget: 4096,
		},
		supportsGlobalEndpoint: true,
		cacheWritesPrice: 0.00001,
		cacheReadsPrice: 0.00001,
		description: "Balanced 70B parameter model for general usage",
	},
	"llama-3.2-3b-akash": {
		contextWindow: 131072,
		maxTokens: 4096,
		inputPrice: 0.00005,
		outputPrice: 0.00005,
		supportsPromptCache: true,
		thinkingConfig: {
			maxBudget: 4096,
		},
		supportsGlobalEndpoint: true,
		cacheWritesPrice: 0.000005,
		cacheReadsPrice: 0.000005,
		description: "Fast and efficient 3B parameter model",
	},
}

// The default model to use if none is specified
export const veniceDefaultModelId: string = "venice-uncensored"
