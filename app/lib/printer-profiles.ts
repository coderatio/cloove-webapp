export type PrinterProfileId = "basic" | "standard"

export interface PrinterProfile {
    id: PrinterProfileId
    label: string
    description: string
    supportsHeating: boolean    // ESC 7
    supportsDensity: boolean    // DC2 #
    supportsCut: boolean        // GS V
    lineDelayMs: number
    useSegmentedCommands: boolean  // true = formatReceiptCommands, false = formatReceiptText
}

export const PRINTER_PROFILES: Record<PrinterProfileId, PrinterProfile> = {
    basic: {
        id: "basic",
        label: "Basic (MPT-II / budget BLE)",
        description: "Plain text only — no bold, alignment, or thermal commands",
        supportsHeating: false,
        supportsDensity: false,
        supportsCut: true,
        lineDelayMs: 400,
        useSegmentedCommands: false,
    },
    standard: {
        id: "standard",
        label: "Standard (ESC/POS compatible)",
        description: "Supports bold, centering, and thermal tuning",
        supportsHeating: true,
        supportsDensity: true,
        supportsCut: true,
        lineDelayMs: 200,
        useSegmentedCommands: true,
    },
}

export const DEFAULT_PROFILE_ID: PrinterProfileId = "basic"
