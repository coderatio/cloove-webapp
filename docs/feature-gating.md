# Feature Gating & Entitlements

Cloove uses two complementary systems for controlling access to features: **Feature Flags (RBAC)** and **Subscription Entitlements (Plan Limits)**.

## 1. Feature Flags (RBAC)
Used for permission-based access control (e.g., Staff vs. Owner). These are typically boolean flags derived from the user's role and permissions.

### `useFeature(key)` hook
The simplest way to check if a user has access to a specific UI section or functional flag.

```tsx
import { useFeature } from "@/app/hooks/useFeature"

function AnalyticsDashboard() {
  const hasAccess = useFeature('beta_analytics')
  
  if (!hasAccess) return <UnauthorizedState />
  return <DetailedCharts />
}
```

---

## 2. Subscription Entitlements (Plan Limits)
Used for checking if a business has sufficient plan "credits" (e.g., number of products, monthly exports, or image interactions).

### `useEntitlement(key)` hook
Returns detailed status for a specific plan limit.

```tsx
import { useEntitlement } from "@/app/hooks/useEntitlements"

function ExportButton() {
  const { allowed, remaining, reason } = useEntitlement('exportsPerMonth')
  
  return (
    <Button disabled={!allowed}>
      Export Report ({remaining} left)
    </Button>
  )
}
```

### `FeatureGuard` Component
A high-level component to wrap entire sections. It can automatically show an "Upgrade Prompt" if the user is limited by their plan.

```tsx
import { FeatureGuard } from "@/app/components/shared/FeatureGuard"

function InventoryPage() {
  return (
    <FeatureGuard 
      feature="products" 
      showUpgradePrompt={true}
    >
      <InventoryList />
    </FeatureGuard>
  )
}
```

## Key Differences

| Feature | `useFeature` | `useEntitlement` |
|---------|--------------|-------------------|
| **Primary Use** | Permissions & Roles | Plan Limits & Usage |
| **Data Source** | `BusinessProvider` (Sync) | `useEntitlements` Query (Async) |
| **Return Type** | `boolean` | `Entitlement` object |
| **Example Key** | `manage_staff`, `view_reports` | `products`, `maxImages`, `exportsPerMonth` |

## Business-Specific Overrides
A unique capability of the Cloove system is the ability to override plan features for a specific business via the `business_config` table.

- Feature overrides are stored as a JSON object under the `feature_flags` key.
- Example JSON: `{"beta_analytics": true, "advanced_inventory": false}`
- These overrides take precedence over the defaults defined in the business's current `Plan`.
- If a feature is not explicitly defined in the `feature_flags` config, it defaults to the plan's setting.

`useFeature` automatically prioritizes these overrides.

## Best Practices
1. **Use `FeatureGuard` for pages**: Wrapping large sections with `showUpgradePrompt={true}` provides the best user journey.
2. **Use `useEntitlement` for actions**: For buttons or specific inputs, use the hook to check `remaining` or `allowed` state.
3. **Owner Bypass**: Both hooks automatically allow all features for `OWNER` roles unless a "hard" plan limit (like `products` count) is reached on the backend OR if a feature is explicitly disabled via `business_config`.
