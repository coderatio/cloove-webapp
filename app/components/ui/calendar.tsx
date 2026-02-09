import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, Chevron as DayPickerChevron } from "react-day-picker"

import { cn } from "@/app/lib/utils"
import { buttonVariants } from "@/app/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                root: "relative",
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 relative",
                month: "space-y-4",
                month_caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-sm font-medium font-serif text-brand-deep dark:text-brand-cream",
                nav: "flex items-center",
                button_previous: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-brand-deep/10 dark:border-white/10 absolute left-1 top-1 z-10"
                ),
                button_next: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-brand-deep/10 dark:border-white/10 absolute right-1 top-1 z-10"
                ),
                month_grid: "border-collapse",
                weekdays: "flex justify-center",
                weekday:
                    "text-brand-accent/40 dark:text-brand-cream/40 w-9 font-normal text-[0.8rem] uppercase tracking-widest pb-2 flex items-center justify-center",
                week: "flex w-full justify-center mt-0",
                day: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                    "h-9 w-9 flex items-center justify-center shrink-0"
                ),
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal transition-all duration-200 rounded-xl",
                    "text-brand-deep dark:text-brand-cream",
                    "hover:bg-brand-green/20 dark:hover:bg-brand-gold/20 hover:text-brand-deep dark:hover:text-brand-gold",
                    "aria-selected:bg-brand-deep aria-selected:text-brand-cream dark:aria-selected:bg-brand-gold dark:aria-selected:text-brand-deep",
                    "aria-selected:opacity-100"
                ),
                range_start: "bg-brand-green/10 dark:bg-brand-gold/20 rounded-l-xl",
                range_end: "bg-brand-green/10 dark:bg-brand-gold/20 rounded-r-xl",
                range_middle: "bg-brand-green/10 dark:bg-brand-gold/20 !rounded-none",
                selected: "!opacity-100",
                today: cn(
                    "relative font-bold text-brand-deep dark:text-brand-gold",
                    "after:absolute after:inset-0 after:rounded-xl after:ring-1 after:ring-inset after:ring-brand-green/20 dark:after:ring-brand-gold/20 after:pointer-events-none",
                    "aria-selected:after:hidden" // Remove border when selected for a seamless slab
                ),
                outside:
                    "outside text-brand-accent/30 opacity-50 aria-selected:bg-brand-green/5 aria-selected:text-brand-accent/30 aria-selected:opacity-30 dark:text-white/20 dark:aria-selected:bg-brand-gold/5 dark:aria-selected:text-white/20",
                disabled: "text-brand-accent/20 opacity-50 dark:text-white/10",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, ...props }) => {
                    if (orientation === "left") {
                        return <ChevronLeft className="h-4 w-4" />
                    }
                    if (orientation === "right") {
                        return <ChevronRight className="h-4 w-4" />
                    }
                    return <DayPickerChevron orientation={orientation} {...props} />
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
