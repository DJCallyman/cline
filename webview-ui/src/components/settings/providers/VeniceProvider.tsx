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
				</>
			)}
		</div>
	)
}
