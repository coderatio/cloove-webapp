import type { LayoutPresetId } from "./layout-presets"

export interface PresetCapabilities {
  fastCheckout: boolean
  showServiceModeChips: boolean
  requirePaymentMethodBeforeCheckout: boolean
  enableKitchenAndTableBeta: boolean
  /** Whether this preset supports the Sales Mode PIN login flow */
  enableSalesMode: boolean
}

const DEFAULT_CAPABILITIES: PresetCapabilities = {
  fastCheckout: false,
  showServiceModeChips: false,
  requirePaymentMethodBeforeCheckout: true,
  enableKitchenAndTableBeta: false,
  enableSalesMode: false,
}

const PRESET_CAPABILITIES: Record<LayoutPresetId, PresetCapabilities> = {
  default: DEFAULT_CAPABILITIES,
  restaurant: {
    fastCheckout: true,
    showServiceModeChips: true,
    requirePaymentMethodBeforeCheckout: true,
    enableKitchenAndTableBeta: true,
    enableSalesMode: true,
  },
  retail: {
    ...DEFAULT_CAPABILITIES,
    fastCheckout: true,
  },
  pharmacy: DEFAULT_CAPABILITIES,
  school: DEFAULT_CAPABILITIES,
}

export function getPresetCapabilities(
  presetId: string | null | undefined
): PresetCapabilities {
  if (presetId && presetId in PRESET_CAPABILITIES) {
    return PRESET_CAPABILITIES[presetId as LayoutPresetId]
  }
  return DEFAULT_CAPABILITIES
}
