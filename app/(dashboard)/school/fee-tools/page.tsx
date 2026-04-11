import { SchoolFeeToolsView } from "@/app/domains/school/components/SchoolFeeToolsView"
import { PresetGate } from "@/app/components/shared/PresetGate"

export default function SchoolFeeToolsPage() {
    return (
        <PresetGate preset="school" featureLabel="Fee tools">
            <SchoolFeeToolsView />
        </PresetGate>
    )
}
