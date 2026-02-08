import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"

interface Column<T> {
    key: keyof T
    header: string
    render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    emptyMessage?: string
    onRowClick?: (row: T) => void
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    emptyMessage = "No data to display",
    onRowClick
}: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="bg-brand-cream/40 dark:bg-white/5 border border-dashed border-brand-accent/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center text-brand-accent/20 mb-4">
                    <ChevronRight className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream opacity-50 mb-2">
                    {emptyMessage}
                </h3>
                <p className="text-sm text-brand-accent/30 dark:text-white/20 max-w-xs">
                    When you start recording entries, your data will be elegantly presented here.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className="text-left text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-white/20 px-6 py-4 border-b border-brand-deep/5 dark:border-white/5"
                                >
                                    {col.header}
                                </th>
                            ))}
                            {onRowClick && (
                                <th className="border-b border-brand-deep/5 dark:border-white/5 w-10"></th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-deep/5 dark:divide-white/5">
                        {data.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row)}
                                className={cn(
                                    "group transition-all duration-200",
                                    onRowClick && "cursor-pointer hover:bg-brand-green/5 dark:hover:bg-brand-gold/5"
                                )}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className="px-6 py-5 text-sm text-brand-deep dark:text-brand-cream/80"
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : String(row[col.key] ?? '-')
                                        }
                                    </td>
                                ))}
                                {onRowClick && (
                                    <td className="px-6 py-5 text-right">
                                        <ChevronRight className="w-4 h-4 text-brand-accent/20 group-hover:text-brand-green dark:group-hover:text-brand-gold transition-colors inline-block" />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

