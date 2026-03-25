import AgentLayout from "@/app/components/field-agent/AgentLayout"

export default function FieldAgentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AgentLayout>{children}</AgentLayout>
}
