/**
 * Single source of truth for product/supply units of measure on the frontend.
 *
 * `value` must exactly match the backend `ProductUnit` enum
 * (api/app/shared/enums/product.ts) — those values are validated by the API and
 * enforced by the products_unit_check DB constraint. Keep the two in sync.
 */
export interface UnitOption {
    value: string
    label: string
}

export const PRODUCT_UNITS: UnitOption[] = [
    // Count / packaging
    { value: "PIECE", label: "Piece" },
    { value: "PAIR", label: "Pair" },
    { value: "SET", label: "Set" },
    { value: "PACK", label: "Pack" },
    { value: "BOX", label: "Box" },
    { value: "CARTON", label: "Carton" },
    { value: "CRATE", label: "Crate" },
    { value: "DOZEN", label: "Dozen" },
    { value: "BUNDLE", label: "Bundle" },
    { value: "BAG", label: "Bag" },
    { value: "SACHET", label: "Sachet" },
    { value: "BOTTLE", label: "Bottle" },
    { value: "ROLL", label: "Roll" },
    { value: "TIN", label: "Tin" },
    // Weight
    { value: "MG", label: "Milligram (mg)" },
    { value: "G", label: "Gram (g)" },
    { value: "KG", label: "Kilogram (kg)" },
    { value: "TONNE", label: "Tonne (t)" },
    { value: "OZ", label: "Ounce (oz)" },
    { value: "LB", label: "Pound (lb)" },
    // Volume
    { value: "ML", label: "Millilitre (ml)" },
    { value: "CL", label: "Centilitre (cl)" },
    { value: "L", label: "Litre (l)" },
    { value: "GAL", label: "Gallon (gal)" },
    // Length
    { value: "MM", label: "Millimetre (mm)" },
    { value: "CM", label: "Centimetre (cm)" },
    { value: "M", label: "Metre (m)" },
    { value: "OTHER", label: "Other" },
]

export const PRODUCT_UNIT_VALUES = PRODUCT_UNITS.map((u) => u.value)

/** Resolve a stored unit code to its display label (falls back to the raw code). */
export function unitLabel(value?: string | null): string {
    if (!value) return ""
    return PRODUCT_UNITS.find((u) => u.value === value)?.label ?? value
}
