"use client"

import * as React from "react"
import { formatReceiptText } from "@/app/lib/receipt-formatter"
import type { ReceiptData } from "@/app/components/shared/ReceiptTemplate"
import { STORAGE_KEYS, storage } from "@/app/lib/storage"
import { Bluetooth as BluetoothIcon, Printer as PrinterIcon } from "lucide-react"
import { GlassCard } from "@/app/components/ui/glass-card"
import {
    Drawer,
    DrawerContent,
    DrawerStickyHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerBody,
} from "@/app/components/ui/drawer"

// Web Bluetooth API types (not in default TS lib)
declare global {
    interface Navigator {
        bluetooth: Bluetooth
    }
    interface Bluetooth {
        requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
    }
    interface RequestDeviceOptions {
        filters?: BluetoothLEScanFilter[]
        optionalServices?: BluetoothServiceUUID[]
        acceptAllDevices?: boolean
    }
    interface BluetoothLEScanFilter {
        services?: BluetoothServiceUUID[]
        name?: string
        namePrefix?: string
    }
    type BluetoothServiceUUID = string | number
    interface BluetoothDevice {
        id: string
        name?: string
        gatt?: BluetoothRemoteGATTServer
        addEventListener(event: string, handler: (e: any) => void): void
        removeEventListener(event: string, handler: (e: any) => void): void
    }
    interface BluetoothRemoteGATTServer {
        device: BluetoothDevice
        connected: boolean
        connect(): Promise<BluetoothRemoteGATTServer>
        disconnect(): void
        getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
        getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    }
    interface BluetoothRemoteGATTService {
        uuid: string
        getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
        getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>
    }
    interface BluetoothRemoteGATTCharacteristic {
        uuid: string
        properties: BluetoothCharacteristicProperties
        writeValueWithoutResponse(value: ArrayBuffer | DataView): Promise<void>
        writeValue(value: ArrayBuffer | DataView): Promise<void>
    }
    interface BluetoothCharacteristicProperties {
        write: boolean
        writeWithoutResponse: boolean
    }
}

// Known BLE UART service UUIDs used by thermal printers
const KNOWN_SERVICE_UUIDS = [
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Nordic UART-like
    "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Telit/Stollmann transparent UART
]

// ESC/POS command bytes
const ESC = 0x1b
const GS = 0x1d
const ESC_INIT = new Uint8Array([ESC, 0x40])           // Initialize printer
const ESC_LEFT = new Uint8Array([ESC, 0x61, 0x00])     // Left alignment
const FEED_AND_CUT = new Uint8Array([
    0x0a, 0x0a, 0x0a, 0x0a,  // Feed 4 lines
    GS, 0x56, 0x01,           // Partial cut
])

// Heating parameters: ESC 7 n1 n2 n3
const ESC_HEAT = new Uint8Array([
    ESC, 0x37,
    2,    // n1: 2 → (2+1)*8 = 24 dots at a time (default ~80)
    60,   // n2: 600µs heating time (lighter but legible)
    40,   // n3: 400µs interval between rows (long cooldown)
])

// Print density: DC2 # n — bits 0-4: density, bits 5-7: break time
const DC2_DENSITY = new Uint8Array([
    0x12, 0x23,
    (0b011 << 5) | 8,  // break time 3 (longest), density 8 (low-medium)
])

// BLE chunk size and delay
const BLE_CHUNK_SIZE = 100
const BLE_CHUNK_DELAY_MS = 30

// Delay between printing each line
const LINE_DELAY_MS = 250

// ── Bluetooth connection engine (singleton, not tied to React) ───────────

let _btDevice: BluetoothDevice | null = null
let _btCharacteristic: BluetoothRemoteGATTCharacteristic | null = null

function markPrinterPaired(device: BluetoothDevice) {
    storage.set(STORAGE_KEYS.BT_PRINTER, JSON.stringify({
        id: device.id,
        name: device.name || "Unknown",
        pairedAt: Date.now(),
    }))
}

function getPairedPrinterName(): string | null {
    const raw = storage.get(STORAGE_KEYS.BT_PRINTER)
    if (!raw) return null
    try {
        return JSON.parse(raw).name || null
    } catch { return null }
}

function hasPairedPrinter(): boolean {
    return !!storage.get(STORAGE_KEYS.BT_PRINTER)
}

function clearPairedPrinter() {
    storage.remove(STORAGE_KEYS.BT_PRINTER)
}

async function discoverWritableCharacteristic(
    server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
    for (const uuid of KNOWN_SERVICE_UUIDS) {
        try {
            const service = await server.getPrimaryService(uuid)
            const chars = await service.getCharacteristics()
            const writable = chars.find(
                (c) => c.properties.writeWithoutResponse || c.properties.write
            )
            if (writable) return writable
        } catch {
            // Service not available on this device, try next
        }
    }

    try {
        const services = await server.getPrimaryServices()
        for (const service of services) {
            try {
                const chars = await service.getCharacteristics()
                const writable = chars.find(
                    (c) => c.properties.writeWithoutResponse || c.properties.write
                )
                if (writable) return writable
            } catch {
                // Skip services that error on characteristic discovery
            }
        }
    } catch {
        // getPrimaryServices() not supported or failed
    }

    return null
}

async function sendViaBluetooth(data: Uint8Array): Promise<boolean> {
    const char = _btCharacteristic
    if (!char) return false

    try {
        for (let offset = 0; offset < data.length; offset += BLE_CHUNK_SIZE) {
            const chunk = data.subarray(offset, Math.min(offset + BLE_CHUNK_SIZE, data.length))
            const buffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer
            if (char.properties.writeWithoutResponse) {
                await char.writeValueWithoutResponse(buffer)
            } else {
                await char.writeValue(buffer)
            }
            if (offset + BLE_CHUNK_SIZE < data.length) {
                await new Promise(resolve => setTimeout(resolve, BLE_CHUNK_DELAY_MS))
            }
        }
        return true
    } catch (err) {
        console.error("BLE write failed:", err)
        _btCharacteristic = null
        return false
    }
}

async function connectToDevice(device: BluetoothDevice): Promise<boolean> {
    try {
        if (!device.gatt) return false

        const server = await device.gatt.connect()
        const characteristic = await discoverWritableCharacteristic(server)
        if (!characteristic) {
            console.error("No writable BLE characteristic found")
            server.disconnect()
            return false
        }

        _btDevice = device
        _btCharacteristic = characteristic

        try {
            const config = new Uint8Array([
                ...ESC_INIT, ...ESC_HEAT, ...DC2_DENSITY,
            ])
            await sendViaBluetooth(config)
        } catch {
            // Non-fatal
        }

        return true
    } catch (err) {
        console.error("BLE connection failed:", err)
        return false
    }
}

/**
 * Open the browser Bluetooth picker, connect, and return success.
 * This is used both for initial pairing and for re-pairing after page reload.
 */
async function requestAndConnect(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.bluetooth) return false

    let device: BluetoothDevice
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: KNOWN_SERVICE_UUIDS.map((uuid) => ({ services: [uuid] })),
            optionalServices: KNOWN_SERVICE_UUIDS,
        })
    } catch {
        try {
            device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: KNOWN_SERVICE_UUIDS,
            })
        } catch {
            // User cancelled both pickers
            return false
        }
    }

    const success = await connectToDevice(device)
    if (success) {
        markPrinterPaired(device)
    }
    return success
}

// ── React context ────────────────────────────────────────────────────────

type PrintMethod = "bluetooth" | "browser"

interface ReceiptPrinterContextValue {
    isConnected: boolean
    /** Whether user has previously paired a BT printer (persisted in localStorage) */
    hasPairedBefore: boolean
    /** Name of previously paired printer, if any */
    pairedPrinterName: string | null
    connectPrinter: () => Promise<boolean>
    /** Forget the paired printer — clears localStorage and disconnects */
    forgetPrinter: () => void
    printReceipt: (data: ReceiptData) => Promise<void>
    printReceiptBT: (data: ReceiptData) => Promise<void>
}

const ReceiptPrinterContext = React.createContext<ReceiptPrinterContextValue | null>(null)

export function ReceiptPrinterProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = React.useState(false)
    const [pairedPrinterName, setPairedPrinterName] = React.useState<string | null>(null)

    // Sync localStorage state on mount
    React.useEffect(() => {
        setPairedPrinterName(getPairedPrinterName())
    }, [])

    const attachDisconnectListener = React.useCallback((device: BluetoothDevice) => {
        device.addEventListener("gattserverdisconnected", () => {
            console.log("[BLE] Printer disconnected")
            _btCharacteristic = null
            setIsConnected(false)

            // Try to reconnect silently (works if device is still in range)
            setTimeout(async () => {
                try {
                    const success = await connectToDevice(device)
                    if (success) {
                        console.log("[BLE] Printer reconnected")
                        setIsConnected(true)
                    }
                } catch {
                    // Reconnect failed — user will be prompted on next print
                }
            }, 1000)
        })
    }, [])

    const connectPrinter = React.useCallback(async (): Promise<boolean> => {
        const success = await requestAndConnect()
        if (success && _btDevice) {
            attachDisconnectListener(_btDevice)
            setPairedPrinterName(_btDevice.name || "Unknown")
        }
        setIsConnected(success)
        return success
    }, [attachDisconnectListener])

    const forgetPrinter = React.useCallback(() => {
        if (_btDevice?.gatt?.connected) {
            _btDevice.gatt.disconnect()
        }
        _btDevice = null
        _btCharacteristic = null
        clearPairedPrinter()
        setIsConnected(false)
        setPairedPrinterName(null)
    }, [])

    const printViaBluetooth = React.useCallback(async (data: ReceiptData) => {
        const encoder = new TextEncoder()
        const text = formatReceiptText(data)
        const lines = text.split("\n")

        const config = new Uint8Array([
            ...ESC_INIT, ...ESC_HEAT, ...DC2_DENSITY, ...ESC_LEFT,
        ])
        const configOk = await sendViaBluetooth(config)
        if (!configOk) {
            setIsConnected(false)
            return
        }

        await new Promise(resolve => setTimeout(resolve, 300))

        for (const line of lines) {
            const lineBytes = encoder.encode(line + "\n")
            const ok = await sendViaBluetooth(lineBytes)
            if (!ok) {
                setIsConnected(false)
                return
            }
            await new Promise(resolve => setTimeout(resolve, LINE_DELAY_MS))
        }

        await new Promise(resolve => setTimeout(resolve, LINE_DELAY_MS))
        const cutOk = await sendViaBluetooth(FEED_AND_CUT)
        if (!cutOk) {
            setIsConnected(false)
        }
    }, [])

    const printViaBrowser = React.useCallback(async (data: ReceiptData) => {
        const text = formatReceiptText(data)

        const iframe = document.createElement("iframe")
        iframe.style.position = "fixed"
        iframe.style.right = "0"
        iframe.style.bottom = "0"
        iframe.style.width = "0"
        iframe.style.height = "0"
        iframe.style.border = "0"
        document.body.appendChild(iframe)

        const iframeDoc = iframe.contentWindow?.document
        if (!iframeDoc) {
            document.body.removeChild(iframe)
            return
        }

        iframeDoc.open()
        iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
<style>
@page { margin: 0; size: 80mm auto; }
body { margin: 0; padding: 0; }
pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.4;
    margin: 0;
    padding: 4mm;
    white-space: pre;
}
</style>
</head>
<body><pre>${escapeHtml(text)}</pre></body>
</html>`)
        iframeDoc.close()

        await new Promise(resolve => setTimeout(resolve, 200))
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()

        setTimeout(() => {
            document.body.removeChild(iframe)
        }, 1000)
    }, [])

    // Resolves a pending print-method choice from the picker
    const pendingChoice = React.useRef<{
        resolve: (method: PrintMethod | null) => void
    } | null>(null)
    const [showPrintPicker, setShowPrintPicker] = React.useState(false)
    const [pendingPrintData, setPendingPrintData] = React.useState<ReceiptData | null>(null)

    const handlePickerChoice = React.useCallback(async (method: PrintMethod | null) => {
        setShowPrintPicker(false)
        const data = pendingPrintData
        setPendingPrintData(null)

        if (!method || !data) return

        if (method === "bluetooth") {
            // User chose BT — trigger the browser BT picker to reconnect
            const success = await requestAndConnect()
            if (success && _btDevice) {
                attachDisconnectListener(_btDevice)
                setPairedPrinterName(_btDevice.name || "Unknown")
                setIsConnected(true)
                await printViaBluetooth(data)
            } else {
                // BT pairing failed/cancelled — fall back to browser
                await printViaBrowser(data)
            }
        } else {
            await printViaBrowser(data)
        }
    }, [pendingPrintData, attachDisconnectListener, printViaBluetooth, printViaBrowser])

    /**
     * Main print function.
     * - BT connected → print via BT
     * - BT not connected, but previously paired → show picker (reconnect BT or browser)
     * - Never paired → browser print
     */
    const printReceipt = React.useCallback(async (data: ReceiptData) => {
        if (_btDevice && _btCharacteristic) {
            // Already connected — print directly
            await printViaBluetooth(data)
        } else if (hasPairedPrinter()) {
            // Previously paired but disconnected — show choice
            setPendingPrintData(data)
            setShowPrintPicker(true)
        } else {
            // No printer ever paired — browser print
            await printViaBrowser(data)
        }
    }, [printViaBluetooth, printViaBrowser])

    const value = React.useMemo<ReceiptPrinterContextValue>(() => ({
        isConnected,
        hasPairedBefore: hasPairedPrinter(),
        pairedPrinterName,
        connectPrinter,
        forgetPrinter,
        printReceipt,
        printReceiptBT: printViaBluetooth,
    }), [isConnected, pairedPrinterName, connectPrinter, forgetPrinter, printReceipt, printViaBluetooth])

    return (
        <ReceiptPrinterContext.Provider value={value}>
            {children}
            {showPrintPicker && (
                <PrintMethodPicker
                    printerName={pairedPrinterName}
                    onChoice={handlePickerChoice}
                />
            )}
        </ReceiptPrinterContext.Provider>
    )
}

/**
 * Inline print method picker — shown when BT was previously paired but not connected.
 * Rendered by the provider so consumers don't need any UI changes.
 */
function PrintMethodPicker({
    printerName,
    onChoice,
}: {
    printerName: string | null
    onChoice: (method: PrintMethod | null) => void
}) {
    return (
        <Drawer open={true} onOpenChange={(open) => !open && onChoice(null)}>
            <DrawerContent className="pb-8">
                <DrawerStickyHeader>
                    <DrawerTitle>Print Receipt</DrawerTitle>
                    <DrawerDescription>
                        Your printer{printerName ? ` (${printerName})` : ""} is not connected. How would you like to proceed?
                    </DrawerDescription>
                </DrawerStickyHeader>
                <DrawerBody>
                    <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto py-2">
                        <GlassCard 
                            hoverEffect 
                            className="p-1 group cursor-pointer border-none ring-1 ring-brand-deep/5 dark:ring-white/5"
                            onClick={() => onChoice("bluetooth")}
                        >
                            <div className="flex flex-col items-center text-center p-8 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20">
                                    <BluetoothIcon className="w-8 h-8 text-blue-500 transition-transform duration-500 group-hover:rotate-12" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="font-sans font-semibold text-lg text-brand-deep dark:text-brand-cream">
                                        Reconnect Printer
                                    </h4>
                                    <p className="text-xs text-brand-accent/60 dark:text-white/40 leading-relaxed max-w-[180px]">
                                        Wait for {printerName || "your device"} to connect via Bluetooth
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard 
                            hoverEffect 
                            className="p-1 group cursor-pointer border-none ring-1 ring-brand-deep/5 dark:ring-white/5"
                            onClick={() => onChoice("browser")}
                        >
                            <div className="flex flex-col items-center text-center p-8 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-brand-gold/5 dark:bg-brand-gold/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-brand-gold/10 dark:group-hover:bg-brand-gold/20">
                                    <PrinterIcon className="w-8 h-8 text-brand-gold transition-transform duration-500 group-hover:-rotate-12" />
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="font-sans font-semibold text-lg text-brand-deep dark:text-brand-cream">
                                        Browser Print
                                    </h4>
                                    <p className="text-xs text-brand-accent/60 dark:text-white/40 leading-relaxed max-w-[180px]">
                                        Quickly output using the system's standard print dialog
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}

export function useReceiptPrinter(): ReceiptPrinterContextValue {
    const ctx = React.useContext(ReceiptPrinterContext)
    if (!ctx) {
        throw new Error("useReceiptPrinter must be used within <ReceiptPrinterProvider>")
    }
    return ctx
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}
