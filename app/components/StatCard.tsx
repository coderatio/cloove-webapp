interface StatCardProps {
    label: string
    value: string
    subtext?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    accent?: 'default' | 'gold' | 'warning' | 'danger'
}

export default function StatCard({
    label,
    value,
    subtext,
    accent = 'default'
}: StatCardProps) {
    const accentStyles = {
        default: {},
        gold: { borderTop: '3px solid #d4af37' },
        warning: { borderTop: '3px solid #ca8a04' },
        danger: { borderTop: '3px solid #dc2626' },
    }

    return (
        <div
            className="stat-card animate-fade-in"
            style={accentStyles[accent]}
        >
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
            {subtext && <p className="stat-subtext">{subtext}</p>}
        </div>
    )
}
