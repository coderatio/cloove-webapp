export interface AgentDefinition {
    id: string
    name: string
    shortName: string
    description: string
    placeholder: string
    /** Tailwind color classes for the agent theme */
    colors: {
        bg: string
        bgHover: string
        border: string
        text: string
        accent: string
        glow: string
    }
    /** lucide-react icon name hint (rendered in component) */
    iconType: "proposal" | "invoice"
}

export const AGENTS: AgentDefinition[] = [
    {
        id: "proposal",
        name: "Business Proposal",
        shortName: "Proposal",
        description: "Create professional business proposals",
        placeholder: "Describe the project, client, scope, and budget...",
        colors: {
            bg: "bg-emerald-500/10",
            bgHover: "hover:bg-emerald-500/15",
            border: "border-emerald-500/30",
            text: "text-emerald-600 dark:text-emerald-400",
            accent: "emerald",
            glow: "shadow-emerald-500/20",
        },
        iconType: "proposal",
    },
    {
        id: "invoice",
        name: "Invoice Generator",
        shortName: "Invoice",
        description: "Create detailed invoices with line items",
        placeholder: "Describe the services, quantities, and rates...",
        colors: {
            bg: "bg-amber-500/10",
            bgHover: "hover:bg-amber-500/15",
            border: "border-amber-500/30",
            text: "text-amber-600 dark:text-amber-400",
            accent: "amber",
            glow: "shadow-amber-500/20",
        },
        iconType: "invoice",
    },
]

export function getAgentById(id: string): AgentDefinition | undefined {
    return AGENTS.find((a) => a.id === id)
}
