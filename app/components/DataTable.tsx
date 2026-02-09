import * as React from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

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
    pageSize?: number
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    emptyMessage = "No data to display",
    onRowClick,
    pageSize = 10
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = React.useState(1)

    // Reset pagination when data changes (e.g., during filtering)
    React.useEffect(() => {
        setCurrentPage(1)
    }, [data])

    if (data.length === 0) {
        return (
            <div className="bg-brand-cream/40 dark:bg-white/5 border border-dashed border-brand-accent/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-accent/5 dark:bg-white/5 flex items-center justify-center text-brand-accent/20 mb-4">
                    <ChevronRight className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="font-serif text-xl font-medium text-brand-deep dark:text-brand-cream opacity-50 mb-2">
                    {emptyMessage}
                </h3>
                <p className="text-sm text-brand-accent/30 dark:text-brand-cream/40 max-w-xs">
                    When you start recording entries, your data will be elegantly presented here.
                </p>
            </div>
        )
    }

    const totalPages = Math.ceil(data.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedData = data.slice(startIndex, startIndex + pageSize)

    return (
        <div className="w-full overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className="text-left text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-6 py-4 border-b border-brand-deep/5 dark:border-white/5"
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
                        {paginatedData.map((row) => (
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
                                        className="px-6 py-5 text-sm text-brand-deep dark:text-brand-cream"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-brand-deep/5 dark:border-white/5 bg-brand-cream/10 dark:bg-white/5">
                    <p className="text-xs text-brand-accent/40 dark:text-brand-cream/40 font-medium">
                        Showing <span className="text-brand-deep dark:text-brand-cream">{startIndex + 1}-{Math.min(startIndex + pageSize, data.length)}</span> of <span className="text-brand-deep dark:text-brand-cream">{data.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="h-8 w-8 p-0 rounded-lg border-brand-deep/5 dark:border-white/10"
                        >
                            <ChevronLeft className="h-4 w-4 dark:text-brand-gold" />
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        currentPage === i + 1
                                            ? "bg-brand-green w-4 dark:bg-brand-gold"
                                            : "bg-brand-accent/20 dark:bg-white/10 hover:bg-brand-accent/40"
                                    )}
                                />
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="h-8 w-8 p-0 rounded-lg border-brand-deep/5 dark:border-white/10"
                        >
                            <ChevronRight className="h-4 w-4 dark:text-brand-gold" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}


