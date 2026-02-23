---
name: cloove-design-system
description: Design and implement UI/UX for the Cloove ecosystem following the "Calm Intelligence" brand guide. Use this skill to ensure consistency across web applications, dashboard modules, and marketing assets.
---

# Cloove Design System: Calm Intelligence

This skill defines the visual and interactive identity of Cloove. Every component, page, and animation must align with the "Calm Intelligence" philosophy—power that is felt, not shouted.

## Design Philosophy: Ultra-Premium Social Commerce

Cloove is **"The Financial Operating System for Social Trade."** The interface must reflect immense trust, financial robustness, and cutting-edge social commerce innovation.

- **Uncompromising Luxury**: Every pixel must feel expensive. Push beyond standard tailwind defaults. Use precise typography, generous negative space, and meticulous alignment.
- **Creative Differentiation**: Avoid generic "SaaS slop". Interfaces should feel like a high-end editorial magazine mixed with a top-tier fintech application.
- **Invisible Power**: The interface should be wildly capable but remain unobtrusive. Complex financial tools (like revenue tracking or commission splitting) should be presented with radical simplicity.
- **Academic Authority + Modern Edge**: Use a blend of striking Serif typography for authority and crisp Sans-Serif for data clarity.
- **Glass & Depth**: Master the use of backdrop blurs (`backdrop-blur-xl`), noise textures, and subtle layered gradients to create a sense of tactile, focused space.
- **Contextual Intelligence**: Insights should whisper, not scream. Use micro-animations (via `framer-motion`) to guide the eye instinctively.

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
Use for containers. It must have a strong backdrop blur, a barely-there border (`border-white/10`), and an underlying glow or shadow that gives it physical presence.

### 2. Premium DataTable & Grids
Rows and grid items must lift organically on hover. Use extremely slow, elegant transitions (`duration-700` to `duration-[2000ms]`). Avoid hard borders; separate items using negative space or ultra-thin 1px lines (`bg-brand-deep/10`).

### 3. Edge-to-Edge Fluidity
Containers on mobile should push to the absolute edges. Product imagery should dominate the screen, uninterrupted by unnecessary padding.

### 4. Cinematic Interactions
Everything should enter the screen with intent. Use staggered fade-ins, gentle upward translations, and parallax effects to make scrolling feel like a cinematic journey.

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
1. **Never use generic Tailwind styles**. Push boundaries. Mix blend modes (`mix-blend-multiply`, `mix-blend-overlay`), use radial gradients, and apply SVG noise textures.
2. **Typography is King**: Let the typography carry the design. Massive headings (`text-7xl` to `text-9xl`) with tight tracking (`tracking-tighter`) for impact, paired with highly legible, tracked-out uppercase micro-copy.
3. **Smooth, Slow Transitions**: Fast animations feel cheap. Luxury is slow and deliberate. Use `transition-all duration-700` to `duration-[2000ms]` for hovers and state changes.
4. **Micro-animations**: Use `framer-motion` extensively for layout changes, entry transitions, and interactions. Everything must animate smoothly.

---
*Created to ensure Cloove remains the premium standard for all business management.*
