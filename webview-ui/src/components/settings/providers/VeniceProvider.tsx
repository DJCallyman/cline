import { veniceModels } from "@shared/api"
import { Mode } from "@shared/storage/types"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { ApiKeyField } from "../common/ApiKeyField"
import { BaseUrlField } from "../common/BaseUrlField"
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
export const VeniceProvider = ({ showModelOptions, isPopup, currentMode }: VeniceProviderProps) => {
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
				signupUrl="https://venice.ai/"
			/>

			<BaseUrlField
				initialValue={apiConfiguration?.veniceBaseUrl}
				label="Use custom base URL"
				onChange={(value) => handleFieldChange("veniceBaseUrl", value)}
				placeholder="Default: https://api.venice.ai/api/v1"
			/>

			{showModelOptions && (
				<>
					<ModelSelector
						label="Model"
						models={veniceModels}
						onChange={(e: any) => {
							handleModeFieldChange(
								{ plan: "planModeVeniceModelId", act: "actModeVeniceModelId" },
								e.target.value,
								currentMode,
							)
						}}
						selectedModelId={selectedModelId}
					/>

					<ModelInfoView isPopup={isPopup} modelInfo={selectedModelInfo} selectedModelId={selectedModelId} />
				</>
			)}
		</div>
	)
}
