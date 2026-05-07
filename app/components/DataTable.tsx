import * as React from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"

export interface Column<T> {
    key: keyof T
    header: string
    render?: (value: T[keyof T], row: T) => React.ReactNode
    width?: string
    headerClassName?: string
    cellClassName?: string
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    emptyMessage?: string
    onRowClick?: (row: T) => void
    pageSize?: number
    isLoading?: boolean
    manualPagination?: {
        currentPage: number
        totalPages: number
        onPageChange: (page: number) => void
        total?: number
    }
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    emptyMessage = "No data to display",
    onRowClick,
    pageSize = 10,
    isLoading = false,
    manualPagination
}: DataTableProps<T>) {
    const [internalPage, setInternalPage] = React.useState(1)

    // Reset internal pagination when data changes
    React.useEffect(() => {
        if (!manualPagination) setInternalPage(1)
    }, [data, manualPagination])

    const currentPage = manualPagination ? manualPagination.currentPage : internalPage
    const setCurrentPage = (page: number) => {
        if (manualPagination) {
            manualPagination.onPageChange(page)
        } else {
            setInternalPage(page)
        }
    }

    if (data.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground/40">
                    <ChevronRight className="h-8 w-8 opacity-100" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground/70">
                    {emptyMessage}
                </h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                    When you start recording entries, your data will be elegantly presented here.
                </p>
            </div>
        )
    }

    const totalPages = manualPagination ? manualPagination.totalPages : Math.ceil(data.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const paginatedData = manualPagination ? data : data.slice(startIndex, startIndex + pageSize)

    return (
        <div className="w-full overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 table-auto">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    style={col.width ? { width: col.width } : undefined}
                                    className={cn(
                                        "text-left text-[10px] font-bold uppercase tracking-widest text-brand-accent/40 dark:text-brand-cream/40 px-6 py-4 border-b border-brand-deep/5 dark:border-white/5 whitespace-nowrap",
                                        "border-b border-border px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-muted-foreground",
                                        !col.width && "min-w-[120px]",
                                        col.headerClassName
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {onRowClick && (
                                <th className="w-12 border-b border-border px-6 py-4"></th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: pageSize === 10 ? 5 : pageSize }).map((_, i) => (
                                <tr key={i}>
                                    {columns.map((col) => (
                                        <td key={String(col.key)} className="px-6 py-5">
                                            <div className="h-4 w-full max-w-[150px] animate-pulse rounded bg-muted" />
                                        </td>
                                    ))}
                                    {onRowClick && <td className="pl-4 pr-6 py-5" />}
                                </tr>
                            ))
                        ) : (
                            paginatedData.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        "group transition-all duration-200",
                                        onRowClick && "cursor-pointer hover:bg-muted/60"
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.key)}
                                            style={col.width ? { width: col.width } : undefined}
                                            className={cn(
                                                "overflow-hidden px-6 py-5 text-ellipsis whitespace-nowrap text-sm text-foreground",
                                                col.cellClassName
                                            )}
                                        >
                                            {col.render
                                                ? col.render(row[col.key], row)
                                                : String(row[col.key] ?? '-')
                                            }
                                        </td>
                                    ))}
                                    {onRowClick && (
                                        <td className="px-6 py-5 text-right w-12">
                                            <ChevronRight className="inline-block h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border bg-muted/25 px-6 py-4">
                    <p className="text-xs font-medium text-muted-foreground">
                        Showing <span className="text-foreground">
                            {manualPagination ? (currentPage - 1) * pageSize + 1 : startIndex + 1}-
                            {manualPagination ? (currentPage - 1) * pageSize + data.length : Math.min(startIndex + pageSize, data.length)}
                        </span> of <span className="text-foreground">{manualPagination?.total ?? data.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            className="h-8 w-8 rounded-lg p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        currentPage === i + 1
                                            ? "w-4 bg-primary"
                                            : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                                    )}
                                />
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="h-8 w-8 rounded-lg p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

