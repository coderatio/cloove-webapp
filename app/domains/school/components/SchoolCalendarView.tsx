"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CalendarRange, GraduationCap, Upload } from "lucide-react"
import Link from "next/link"
import { PageTransition } from "@/app/components/layout/page-transition"
import { ManagementHeader } from "@/app/components/shared/ManagementHeader"
import { Button } from "@/app/components/ui/button"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Markdown } from "@/app/components/ui/markdown"
import { SchoolAcademicCalendarPanel } from "./SchoolAcademicCalendarPanel"
import { SchoolFeeToolsSection } from "./SchoolFeeToolsSection"
import { SchoolRosterImportDrawer } from "./SchoolRosterImportDrawer"
import { useLayoutPresetId } from "@/app/domains/workspace/hooks/usePresetPageCopy"
import { usePermission } from "@/app/hooks/usePermission"
import { cn } from "@/app/lib/utils"

const sectionMotion = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
}

function RosterImportTrigger() {
    const { can } = usePermission()
    const [open, setOpen] = React.useState(false)

    if (!can("CREATE_CUSTOMER")) return null

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                className="rounded-full transition-all duration-300"
                onClick={() => setOpen(true)}
            >
                <Upload className="h-4 w-4 mr-2 opacity-80" />
                Import roster
            </Button>
            <SchoolRosterImportDrawer open={open} onOpenChange={setOpen} />
        </>
    )
}

export function SchoolCalendarView() {
    const preset = useLayoutPresetId()

    if (preset !== "school") {
        return (
            <PageTransition>
                <div className="max-w-5xl mx-auto space-y-8 pb-24">
                    <motion.div {...sectionMotion} transition={{ duration: 0.35 }}>
                        <ManagementHeader
                            title="School calendar"
                            description="Academic years and terms are available when your workspace uses the School & training layout."
                        />
                    </motion.div>
                    <motion.div
                        {...sectionMotion}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="will-change-transform"
                    >
                        <GlassCard
                            className={cn(
                                "overflow-hidden border-brand-gold/15 bg-linear-to-br from-white/60 to-brand-gold/[0.04] dark:from-white/[0.06] dark:to-brand-gold/[0.03]"
                            )}
                        >
                            <div className="border-b border-brand-deep/5 px-4 py-4 dark:border-white/10 md:px-6 md:py-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-serif text-lg text-brand-deep dark:text-brand-cream">
                                            Switch to School & training
                                        </h2>
                                        <p className="mt-1 text-sm text-brand-deep/65 dark:text-brand-cream/65 max-w-xl">
                                            Years, terms, and default fee periods unlock when this layout is active—so
                                            every payment can stay aligned with your academic calendar.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-5 md:px-6 md:py-6 space-y-4">
                                <p className="text-sm text-brand-deep/80 dark:text-brand-cream/85 leading-relaxed">
                                    Go to{" "}
                                    <strong className="font-medium text-brand-deep dark:text-brand-cream">
                                        Settings → Workspace
                                    </strong>{" "}
                                    and choose <strong>School & training</strong>. You will be able to manage terms,
                                    roster import, fee shortcuts, and payment links in one place.
                                </p>
                                <Button asChild className="rounded-full transition-all duration-300">
                                    <Link href="/settings?tab=workspace">Open workspace settings</Link>
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto space-y-8 pb-24">
                <motion.div {...sectionMotion} transition={{ duration: 0.35 }}>
                    <ManagementHeader
                        title="Years & terms"
                        description="Define academic sessions and terms. Tag fee payments to a period and set a default term for new sales."
                        extraActions={<RosterImportTrigger />}
                    />
                </motion.div>

                <motion.section
                    {...sectionMotion}
                    transition={{ duration: 0.35, delay: 0.06 }}
                    className="rounded-[28px] border border-brand-gold/15 bg-linear-to-br from-brand-gold/[0.06] via-transparent to-brand-deep/[0.03] dark:from-brand-gold/10 dark:to-brand-deep/20 px-4 py-4 md:px-6 md:py-5"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-gold border border-brand-gold/20">
                            <CalendarRange className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-serif text-base text-brand-deep dark:text-brand-cream">
                                Academic rhythm
                            </p>
                            <div className="text-sm text-brand-deep/70 dark:text-brand-cream/75 mt-0.5 max-w-2xl">
                                <Markdown content="Set **years** first, then **terms**. Staff get a default term on new fees—fewer mistakes at the till." />
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.div
                    {...sectionMotion}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="space-y-8"
                >
                    <SchoolAcademicCalendarPanel showIntro={false} />
                    <SchoolFeeToolsSection />
                </motion.div>
            </div>
        </PageTransition>
    )
}
