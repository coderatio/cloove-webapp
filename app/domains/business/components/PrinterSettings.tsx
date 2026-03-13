"use client"

import { useState } from "react"
import { GlassCard } from "@/app/components/ui/glass-card"
import { Button } from "@/app/components/ui/button"
import { Switch } from "@/app/components/ui/switch"
import {
    Printer,
    Unplug,
    CheckCircle2,
    Loader2,
    ChevronRight,
    Trash2,
    Smartphone,
} from "lucide-react"
import { toast } from "sonner"
import { useReceiptPrinter } from "@/app/hooks/useReceiptPrinter"
import { PRINTER_PROFILES, type PrinterProfileId } from "@/app/lib/printer-profiles"

export function PrinterSettings() {
    const {
        isConnected,
        pairedPrinterName,
        hasPairedBefore,
        connectPrinter,
        forgetPrinter,
        printerProfileId,
        setPrinterProfile,
        alwaysUseBT,
        setAlwaysUseBT,
        isBluetoothAppAvailable,
    } = useReceiptPrinter()

    const [isConnecting, setIsConnecting] = useState(false)

    const handleConnect = async () => {
        setIsConnecting(true)
        try {
            const success = await connectPrinter()
            if (success) {
                toast.success("Printer connected", { description: "Your thermal printer is ready for receipts." })
            } else {
                toast.error("Connection failed", { description: "Could not connect to printer. Make sure it's powered on and Bluetooth is enabled." })
            }
        } catch {
            toast.error("Connection failed", { description: "Your browser may not support Bluetooth devices." })
        } finally {
            setIsConnecting(false)
        }
    }

    const handleForget = () => {
        forgetPrinter()
        toast.success("Printer forgotten", { description: "Bluetooth printer data has been cleared." })
    }

    const profiles = Object.values(PRINTER_PROFILES)

    return (
        <div className="space-y-8">
            {/* Connected Printer */}
            <section className="space-y-4">
                <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Connected Printer</h2>
                <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Printer className="w-4 h-4 text-brand-deep dark:text-brand-cream" />
                                <span className="font-medium text-brand-deep dark:text-brand-cream">
                                    {pairedPrinterName || "Bluetooth Thermal Printer"}
                                </span>
                                {isConnected && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Connected
                                    </span>
                                )}
                                {!isConnected && hasPairedBefore && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">
                                        Disconnected
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                {isConnected
                                    ? "Receipts will print directly via Bluetooth. Re-pair if you switch printers."
                                    : hasPairedBefore
                                        ? "Printer was previously paired. Connect to resume Bluetooth printing."
                                        : "Connect your thermal printer (e.g. MPT-II) via Bluetooth to print receipts directly."
                                }
                            </p>
                        </div>
                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            variant="outline"
                            className="rounded-xl px-4 text-xs font-bold border-brand-deep/20 hover:bg-brand-deep/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            {isConnecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isConnected ? (
                                <>
                                    <Unplug className="w-4 h-4 mr-2" />
                                    Re-pair
                                </>
                            ) : (
                                <>
                                    Connect Printer
                                    <ChevronRight className="w-4 h-4 ml-2 text-brand-deep/30 dark:text-brand-cream/40" />
                                </>
                            )}
                        </Button>
                    </div>
                    {hasPairedBefore && (
                        <>
                            <div className="h-px bg-brand-deep/5 dark:bg-white/5" />
                            <Button
                                onClick={handleForget}
                                variant="ghost"
                                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/5 dark:hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Forget Printer
                            </Button>
                        </>
                    )}
                </GlassCard>
            </section>

            {/* Printer Profile */}
            {hasPairedBefore && (
                <section className="space-y-4">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Printer Profile</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {profiles.map((profile) => {
                            const isActive = printerProfileId === profile.id
                            return (
                                <GlassCard
                                    key={profile.id}
                                    hoverEffect
                                    className={`p-5 rounded-3xl before:rounded-3xl cursor-pointer transition-all ${isActive
                                        ? "ring-2 ring-brand-gold dark:ring-brand-gold"
                                        : "ring-1 ring-brand-deep/5 dark:ring-white/5"
                                        }`}
                                    onClick={() => setPrinterProfile(profile.id as PrinterProfileId)}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-brand-deep dark:text-brand-cream">
                                                {profile.label}
                                            </span>
                                            {isActive && (
                                                <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                                            )}
                                        </div>
                                        <p className="text-xs text-brand-accent/60 dark:text-white/40 leading-relaxed">
                                            {profile.description}
                                        </p>
                                    </div>
                                </GlassCard>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Preferences */}
            {hasPairedBefore && (
                <section className="space-y-4">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Preferences</h2>
                    <GlassCard className="p-6 rounded-3xl before:rounded-3xl">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="font-medium text-brand-deep dark:text-brand-cream">
                                    Always print via Bluetooth
                                </span>
                                <p className="text-xs text-brand-accent/60 dark:text-white/40">
                                    Skip the print method picker and auto-reconnect to your printer. Falls back to the picker if reconnection fails.
                                </p>
                            </div>
                            <Switch
                                checked={alwaysUseBT}
                                onCheckedChange={setAlwaysUseBT}
                            />
                        </div>
                    </GlassCard>
                </section>
            )}

            {/* Bluetooth Print App (Android) */}
            {isBluetoothAppAvailable && (
                <section className="space-y-4">
                    <h2 className="font-serif text-xl text-brand-deep dark:text-brand-cream pl-1">Bluetooth Print App</h2>
                    <GlassCard className="p-6 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                <Smartphone className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-medium text-brand-deep dark:text-brand-cream">
                                    Print via Android App
                                </span>
                                <p className="text-xs text-brand-accent/60 dark:text-white/40 leading-relaxed">
                                    Your browser doesn't support direct Bluetooth printing. Install the{" "}
                                    <strong>Bluetooth Print</strong> app from the Play Store to print receipts
                                    on your thermal printer. When printing from Orders, select "Bluetooth Print App"
                                    from the print method picker.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </section>
            )}
        </div>
    )
}
