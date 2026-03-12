import { FinanceView } from "@/app/domains/finance/components/FinanceView"
import { PermissionGuard } from "@/app/components/shared/PermissionGuard"

export default function FinancePage() {
    return (
        <PermissionGuard permission="VIEW_FINANCIALS">
            <FinanceView />
        </PermissionGuard>
    )
}
