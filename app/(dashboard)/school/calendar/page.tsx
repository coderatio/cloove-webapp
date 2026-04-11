import { SchoolCalendarView } from "@/app/domains/school/components/SchoolCalendarView"
import { PresetGate } from "@/app/components/shared/PresetGate"

export default function SchoolCalendarPage() {
    return (
        <PresetGate preset="school" featureLabel="Academic calendar">
            <SchoolCalendarView />
        </PresetGate>
    )
}
