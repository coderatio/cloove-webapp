"use client"

import * as React from "react"
import { formatReceiptText } from "@/app/lib/receipt-formatter"
import type { ReceiptData } from "@/app/components/shared/ReceiptTemplate"

// Web USB API types (not in default TS lib)
declare global {
    interface Navigator {
        usb: {
            requestDevice(options: { filters: Array<Record<string, unknown>> }): Promise<USBDevice>
        }
    }
    interface USBDevice {
        open(): Promise<void>
        close(): Promise<void>
        selectConfiguration(configurationValue: number): Promise<void>
        claimInterface(interfaceNumber: number): Promise<void>
        transferOut(endpointNumber: number, data: ArrayBufferView | ArrayBuffer): Promise<unknown>
        configuration: {
            interfaces: Array<{
                interfaceNumber: number
                alternate: {
                    endpoints: Array<{
                        direction: "in" | "out"
                        type: "bulk" | "interrupt" | "isochronous"
                        endpointNumber: number
                    }>
                }
            }>
        } | null
    }
}

// ESC/POS command bytes
const ESC = 0x1b
const GS = 0x1d
const ESC_INIT = new Uint8Array([ESC, 0x40])           // Initialize printer
const ESC_CENTER = new Uint8Array([ESC, 0x61, 0x01])   // Center alignment
const ESC_LEFT = new Uint8Array([ESC, 0x61, 0x00])     // Left alignment
const FEED_AND_CUT = new Uint8Array([
    0x0a, 0x0a, 0x0a, 0x0a,  // Feed 4 lines
    GS, 0x56, 0x01,           // Partial cut
])

export const useReceiptPrinter = () => {
    const usbDeviceRef = React.useRef<USBDevice | null>(null)
    const endpointRef = React.useRef<number | null>(null)

    /**
     * Send raw bytes to the connected USB printer.
     */
    const sendToUSB = React.useCallback(async (data: Uint8Array): Promise<boolean> => {
        const device = usbDeviceRef.current
        const ep = endpointRef.current
        if (!device || ep === null) return false
        try {
            await device.transferOut(ep, data)
            return true
        } catch (err) {
            console.error("USB transfer failed:", err)
            return false
        }
    }, [])

    /**
     * Print receipt directly over USB using ESC/POS raw text.
     * This is the ONLY reliable method for thermal printers like MPT-II —
     * browser window.print() sends graphical data which these printers cannot interpret.
     */
    const printViaUSB = React.useCallback(async (data: ReceiptData) => {
        const text = formatReceiptText(data)
        const encoder = new TextEncoder()

        await sendToUSB(ESC_INIT)
        await sendToUSB(ESC_LEFT)
        await sendToUSB(encoder.encode(text))
        await sendToUSB(FEED_AND_CUT)
    }, [sendToUSB])

    /**
     * Fallback: print via browser print dialog.
     * NOTE: This only works if the OS has a proper printer driver installed
     * that converts graphical data to the printer's format. Most raw thermal
     * printers (MPT-II etc.) will produce gibberish with this method.
     */
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

    /**
     * Connect to a USB thermal printer. The user will be prompted to
     * select the device. The connection is stored for the session —
     * call this once, then printReceipt() will use USB automatically.
     */
    const connectUSBPrinter = React.useCallback(async (): Promise<boolean> => {
        try {
            if (!navigator.usb) {
                console.error("Web USB API not supported in this browser")
                return false
            }

            const device = await navigator.usb.requestDevice({
                filters: []
            })
            await device.open()

            if (device.configuration === null) {
                await device.selectConfiguration(1)
            }

            const iface = device.configuration?.interfaces[0]
            if (!iface) {
                console.error("No interface found on USB device")
                return false
            }

            await device.claimInterface(iface.interfaceNumber)

            // Find the bulk OUT endpoint for sending data
            const endpoint = iface.alternate.endpoints.find(
                (ep) => ep.direction === "out" && ep.type === "bulk"
            )
            if (!endpoint) {
                console.error("No bulk OUT endpoint found — is this a printer?")
                return false
            }

            usbDeviceRef.current = device
            endpointRef.current = endpoint.endpointNumber
            return true
        } catch (err) {
            console.error("USB printer connection failed:", err)
            return false
        }
    }, [])

    /**
     * Main print function. Uses USB direct printing if a printer is
     * connected, otherwise falls back to the browser print dialog.
     *
     * For thermal printers (MPT-II, etc.), call connectUSBPrinter() first
     * to pair the device — this enables reliable raw-text printing.
     */
    const printReceipt = React.useCallback(async (data: ReceiptData) => {
        if (usbDeviceRef.current && endpointRef.current !== null) {
            await printViaUSB(data)
        } else {
            await printViaBrowser(data)
        }
    }, [printViaUSB, printViaBrowser])

    return { printReceipt, printReceiptUSB: printViaUSB, connectUSBPrinter }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}
