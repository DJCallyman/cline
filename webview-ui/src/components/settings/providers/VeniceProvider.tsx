import { veniceModels } from "@shared/api"
import { Mode } from "@shared/storage/types"
import { type FC } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { ApiKeyField } from "../common/ApiKeyField"
import { ModelInfoView } from "../common/ModelInfoView"
import { ModelSelector } from "../common/ModelSelector"
import { normalizeApiConfiguration } from "../utils/providerUtils"
import { useApiConfigurationHandlers } from "../utils/useApiConfigurationHandlers"

/**
 * Props for the VeniceProvider component
 */
interface VeniceProviderProps {
	showModelOptions: boolean
	isPopup?: boolean
	currentMode: Mode
}

/**
 * The Venice provider configuration component
 */
export const VeniceProvider: FC<VeniceProviderProps> = ({ showModelOptions, isPopup, currentMode }) => {
	const { apiConfiguration } = useExtensionState()
	const { handleFieldChange, handleModeFieldChange } = useApiConfigurationHandlers()

	// Get the normalized configuration
	const { selectedModelId, selectedModelInfo } = normalizeApiConfiguration(apiConfiguration, currentMode)

	return (
		<div>
			<ApiKeyField
				initialValue={apiConfiguration?.veniceApiKey || ""}
				onChange={(value) => handleFieldChange("veniceApiKey", value)}
				providerName="Venice"
				signupUrl="https://venice.ai"
			/>

			{showModelOptions && (
				<>
					<ModelSelector
						label="Model"
						models={veniceModels}
						onChange={(e: any) =>
							handleModeFieldChange(
								{ plan: "planModeVeniceModelId", act: "actModeVeniceModelId" },
								e.target.value,
								currentMode,
							)
						}
						selectedModelId={selectedModelId}
					/>

					<ModelInfoView isPopup={isPopup} modelInfo={selectedModelInfo} selectedModelId={selectedModelId} />

					{/* Venice Parameters */}
					<div className="mt-4 space-y-3">
						<h4 className="text-sm font-medium text-text">Venice Parameters</h4>

						{/* Web Search Setting */}
						<div>
							<label className="block text-sm text-text-secondary mb-1">Web Search</label>
							<select
								className="w-full px-3 py-2 border border-border rounded-md bg-background text-text text-sm"
								onChange={(e) => {
									handleFieldChange("veniceEnableWebSearch", e.target.value as "auto" | "on" | "off")
								}}
								value={apiConfiguration?.veniceEnableWebSearch || "auto"}>
								<option value="auto">Auto</option>
								<option value="on">On</option>
								<option value="off">Off</option>
							</select>
						</div>

						{/* Include Search Results in Stream */}
						{apiConfiguration?.veniceEnableWebSearch !== "off" && (
							<div className="flex items-center">
								<input
									checked={apiConfiguration?.veniceIncludeSearchResultsInStream || false}
									className="mr-2"
									id="veniceIncludeSearchResults"
									onChange={(e) => {
										handleFieldChange("veniceIncludeSearchResultsInStream", e.target.checked)
									}}
									type="checkbox"
								/>
								<label className="text-sm text-text-secondary" htmlFor="veniceIncludeSearchResults">
									Include search results in stream
								</label>
							</div>
						)}

						{/* Include Venice System Prompt */}
						<div className="flex items-center">
							<input
								checked={apiConfiguration?.veniceIncludeVeniceSystemPrompt || false}
								className="mr-2"
								id="veniceIncludeSystemPrompt"
								onChange={(e) => handleFieldChange("veniceIncludeVeniceSystemPrompt", e.target.checked)}
								type="checkbox"
							/>
							<label className="text-sm text-text-secondary" htmlFor="veniceIncludeSystemPrompt">
								Include Venice system prompt
							</label>
						</div>

						{/* Thinking Controls for Reasoning Models */}
						{(selectedModelId === "qwen3-4b" || selectedModelId === "qwen3-235b") && (
							<>
								<div className="flex items-center">
									<input
										checked={apiConfiguration?.veniceStripThinkingResponse || false}
										className="mr-2"
										id="veniceStripThinking"
										onChange={(e) => handleFieldChange("veniceStripThinkingResponse", e.target.checked)}
										type="checkbox"
									/>
									<label className="text-sm text-text-secondary" htmlFor="veniceStripThinking">
										Strip thinking from response
									</label>
								</div>

								<div className="flex items-center">
									<input
										checked={apiConfiguration?.veniceDisableThinking || false}
										className="mr-2"
										id="veniceDisableThinking"
										onChange={(e) => handleFieldChange("veniceDisableThinking", e.target.checked)}
										type="checkbox"
									/>
									<label className="text-sm text-text-secondary" htmlFor="veniceDisableThinking">
										Disable thinking mode
									</label>
								</div>
							</>
						)}
					</div>
				</>
			)}
		</div>
	)
}
