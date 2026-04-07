"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"

import { cn } from "@/app/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { useIsMobile } from "@/app/hooks/useMediaQuery"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerStickyHeader,
    DrawerBody,
    DrawerFooter,
    DrawerClose,
    DrawerTitle,
} from "@/app/components/ui/drawer"

export interface DatePickerFieldProps {
    /** Local date as `yyyy-MM-dd` */
    value: string
    onChange: (next: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    id?: string
    /** Id of a separate element that labels this control (not the control’s own `id`). Omit when using `<Label htmlFor={id}>`. */
    "aria-labelledby"?: string
}

function parseLocalDate(value: string): Date | undefined {
    if (!value?.trim()) return undefined
    const d = parseISO(`${value.trim()}T12:00:00`)
    return isValid(d) ? d : undefined
}

export function DatePickerField({
    value,
    onChange,
    placeholder = "Pick a date",
    disabled,
    className,
    id,
    "aria-labelledby": ariaLabelledBy,
}: DatePickerFieldProps) {
    const isMobile = useIsMobile()
    const [open, setOpen] = React.useState(false)
    const selected = parseLocalDate(value)

    const label = selected ? format(selected, "LLL dd, y") : null

    const handleSelect = (d: Date | undefined) => {
        if (!d) return
        onChange(format(d, "yyyy-MM-dd"))
        if (!isMobile) setOpen(false)
    }

    const trigger = (
        <Button
            type="button"
            id={id}
            variant="outline"
            disabled={disabled}
            {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
            className={cn(
                "rounded-2xl h-[46px] w-full justify-start text-left font-medium transition-all duration-300",
                "bg-white border-brand-deep/8 dark:border-brand-gold/20 dark:bg-brand-deep/20 px-4",
                !label && "text-brand-accent/60 dark:text-brand-cream/60",
                label && "border-brand-green/30 dark:border-brand-gold/30 bg-brand-green/5 dark:bg-brand-gold/5 text-brand-deep dark:text-brand-cream"
            )}
        >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{label ?? placeholder}</span>
        </Button>
    )

    if (disabled) {
        return (
            <div className={className}>
                {trigger}
            </div>
        )
    }

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild className={className}>
                    {trigger}
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerStickyHeader>
                        <DrawerTitle className="text-xl">Pick date</DrawerTitle>
                    </DrawerStickyHeader>
                    <DrawerBody className="flex justify-center p-0">
                        <Calendar
                            mode="single"
                            defaultMonth={selected ?? new Date()}
                            selected={selected}
                            onSelect={handleSelect}
                            initialFocus
                            className="p-6"
                        />
                    </DrawerBody>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button className="w-full rounded-xl bg-brand-deep text-brand-gold dark:bg-brand-gold dark:text-brand-deep font-bold text-sm h-12 shadow-lg">
                                Done
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className={className}>
                {trigger}
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 rounded-3xl overflow-hidden border-brand-deep/5 dark:border-white/10 shadow-2xl z-50"
                align="start"
                sideOffset={8}
            >
                <Calendar
                    mode="single"
                    defaultMonth={selected ?? new Date()}
                    selected={selected}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
