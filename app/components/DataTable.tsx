interface Column<T> {
    key: keyof T
    header: string
    render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    emptyMessage?: string
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    emptyMessage = "No data to display"
}: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="card text-center py-12">
                <p className="text-muted">{emptyMessage}</p>
                <p className="text-small text-muted mt-2">
                    When you start recording, data will appear here.
                </p>
            </div>
        )
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={String(col.key)}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            {columns.map((col) => (
                                <td key={String(col.key)}>
                                    {col.render
                                        ? col.render(row[col.key], row)
                                        : String(row[col.key] ?? '-')
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
