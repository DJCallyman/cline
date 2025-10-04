import { veniceModels } from "@shared/api"
import { Mode } from "@shared/storage/types"
import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react"
import { type FC } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { ApiKeyField } from "../common/ApiKeyField"
import { ModelInfoView } from "../common/ModelInfoView"
import { DropdownContainer, ModelSelector } from "../common/ModelSelector"
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

	// Get mode-specific Venice parameters
	const getModeSpecificParameter = (paramName: string) => {
		if (currentMode === "plan") {
			return apiConfiguration?.[`planMode${paramName}` as keyof typeof apiConfiguration]
		} else {
			return apiConfiguration?.[`actMode${paramName}` as keyof typeof apiConfiguration]
		}
	}

	const getModeSpecificBooleanParameter = (paramName: string): boolean => {
		return (getModeSpecificParameter(paramName) as boolean) || false
	}

	const getModeSpecificStringParameter = (paramName: string): string => {
		return (getModeSpecificParameter(paramName) as string) || "auto"
	}

	const setModeSpecificParameter = (paramName: string, value: any) => {
		const fieldName = currentMode === "plan" ? `planMode${paramName}` : `actMode${paramName}`
		handleFieldChange(fieldName as any, value)
	}

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
						<DropdownContainer>
							<label htmlFor="venice-web-search">
								<span style={{ fontWeight: 500 }}>Web Search</span>
							</label>
							<VSCodeDropdown
								id="venice-web-search"
								onChange={(e: any) => {
									setModeSpecificParameter("VeniceEnableWebSearch", e.target.value as "auto" | "on" | "off")
								}}
								style={{ width: "100%" }}
								value={getModeSpecificStringParameter("VeniceEnableWebSearch")}>
								<VSCodeOption value="auto">Auto</VSCodeOption>
								<VSCodeOption value="on">On</VSCodeOption>
								<VSCodeOption value="off">Off</VSCodeOption>
							</VSCodeDropdown>
						</DropdownContainer>

						{/* Include Search Results in Stream */}
						{getModeSpecificStringParameter("VeniceEnableWebSearch") !== "off" && (
							<div className="flex items-center">
								<input
									checked={getModeSpecificBooleanParameter("VeniceIncludeSearchResultsInStream")}
									className="mr-2"
									id="veniceIncludeSearchResults"
									onChange={(e) => {
										setModeSpecificParameter("VeniceIncludeSearchResultsInStream", e.target.checked)
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
								checked={getModeSpecificBooleanParameter("VeniceIncludeVeniceSystemPrompt")}
								className="mr-2"
								id="veniceIncludeSystemPrompt"
								onChange={(e) => setModeSpecificParameter("VeniceIncludeVeniceSystemPrompt", e.target.checked)}
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
										checked={getModeSpecificBooleanParameter("VeniceStripThinkingResponse")}
										className="mr-2"
										id="veniceStripThinking"
										onChange={(e) =>
											setModeSpecificParameter("VeniceStripThinkingResponse", e.target.checked)
										}
										type="checkbox"
									/>
									<label className="text-sm text-text-secondary" htmlFor="veniceStripThinking">
										Strip thinking from response
									</label>
								</div>

								<div className="flex items-center">
									<input
										checked={getModeSpecificBooleanParameter("VeniceDisableThinking")}
										className="mr-2"
										id="veniceDisableThinking"
										onChange={(e) => setModeSpecificParameter("VeniceDisableThinking", e.target.checked)}
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
