---
name: cloove-design-system
description: Design and implement UI/UX for the Cloove ecosystem following the "Calm Intelligence" brand guide. Use this skill to ensure consistency across web applications, dashboard modules, and marketing assets.
---

# Cloove Design System: Calm Intelligence

This skill defines the visual and interactive identity of Cloove. Every component, page, and animation must align with the "Calm Intelligence" philosophy—power that is felt, not shouted.

## Design Philosophy

- **Invisible Power**: The interface should be efficient and robust, but remain "calm" and unobtrusive.
- **Academic Luxury**: Use a blend of Serif typography for authority and Sans-Serif for modern clarity.
- **Glass & Depth**: Leverage backdrop blurs and subtle layering to create a sense of focused space.
- **Contextual Intelligence**: Insights should whisper, not scream. Use `InsightWhisper` and subtle badges for AI-driven recommendations.

## Color Palette

The Cloove palette is inspired by natural forest depths and luxury academic environments.

| Token | Hex | Usage |
| :--- | :--- | :--- |
| **Brand Deep** | `#062c21` | Backgrounds (Dark), Primary Text (Light), Sidebars |
| **Brand Green** | `#0b3d2e` | Secondary Backgrounds, Interactive Hovers |
| **Brand Gold** | `#d4af37` | Accents, Active Nav, AI-driven Highlights, Buttons |
| **Brand Cream** | `#fdfcf8` | Page Backgrounds (Light), Primary Text (Dark) |
| **Brand Accent** | `#1e4d3f` | Borders, Muted Text, Glass Shadows |

## Typography

Available in `globals.css` via CSS variables:

- **Serif (`var(--font-serif)`)**: *Playfair Display*. Used for headings, stat values, and "human" elements.
- **Sans (`var(--font-sans)`)**: *Plus Jakarta Sans*. Used for body text, UI controls, and data tables.
- **Mono**: System Mono. Used for IDs, dates, and technical data.

## Core Component Patterns

### 1. The Glass Panel (`GlassCard`)
Use for dashboard containers. It should have a subtle backdrop blur and a thin, semi-transparent border.
```tsx
<GlassCard className="p-6">
  {/* Content */}
</GlassCard>
```

### 2. Premium DataTable
Rows must lift on hover and show a chevron. Use the `DataTable` component which handles pagination and click flows automatically.
- **Light Theme**: Borderless with subtle row separators.
- **Dark Theme**: Enhanced contrast with glass-like backgrounds.

### 3. Management Headers
A unified command bar pattern using the `ManagementHeader` component:
- Global Search (left)
- Filter Popover (multi-select)
- Primary "Add" Action (right)

### 4. Interactive Drawers
All CRUD and detail views should use the `Drawer` system (built on `vaul`).
- **Sticky Headers**: Always keep the title and description visible.
- **Focused Forms**: Keep input widths controlled/centered for legibility.

## Dark Mode Best Practices
- Avoid pure black (`#000`). Use `Brand Deep` (`#062c21`) as the base.
- Borders should be extremely subtle (e.g., `rgba(255, 255, 255, 0.05)`).
- Ensure `Brand Gold` provides at least 3:1 contrast against `Brand Deep`.

## Spacing
Follow the 4px grid defined in `globals.css` (e.g., `gap-4`, `p-8`).

## Frontend Architecture: Domain-Driven Design (DDD)

To maintain a clean and scalable codebase, especially as the dashboard grows, follow the "Slim Page" pattern:

### 1. Domain-Specific Folders
Logic and UI should be grouped by domain in `app/domains/[domain]`.
- **components/**: Domain-specific views (e.g., `InventoryView.tsx`, `DashboardView.tsx`).
- **providers/**: Specialized React Contexts for domain state (e.g., `StoreProvider.tsx`).
- **data/**: Domain constants, types, and mock objects.
- **hooks/**: Encapsulated business logic.

### 2. Slim Page Wrappers
Next.js pages in `app/(dashboard)/` should act only as routers and configuration layers.
- **Minimal Logic**: No state management or business logic in the page file.
- **Client/Server Boundary**: Handle `Suspense` or server-side data fetching, then delegate to a `DomainView`.
- **Context Injection**: Use pages to inject global providers or handle URL search params before passing them down.

**Example Page Structure:**
```tsx
export default function OrdersPage() {
    return (
        <Suspense fallback={<Loader />}>
            <OrdersView /> {/* All logic lives inside the view */}
        </Suspense>
    )
}
```

## Implementation Rules
1. **Never use generic Tailwind colors** (e.g., `bg-blue-500`). Use brand tokens like `bg-brand-deep`.
2. **Smooth Transitions**: Always apply `transition-all duration-300` to interactive elements.
3. **Micro-animations**: Use `framer-motion` for entry transitions and hover states.
4. **Decoupled Stores**: Each domain should manage its own state via a dedicated Provider if global access is required.

---
*Created to ensure Cloove remains the premium standard for all business management.*
