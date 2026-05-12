/**
 * Human-readable labels for transaction statuses returned by the API
 * (see `StatusMap` in `v1/api/.../finance_types.ts`). Filter/query params
 * still use the canonical strings (e.g. "Cleared").
 */
const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  Cleared: 'Successful',
  Pending: 'Pending',
  Processing: 'Processing',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
}

export function getTransactionStatusLabel(status: string | undefined | null): string {
  if (!status) return '—'
  return TRANSACTION_STATUS_LABELS[status] ?? status
}
