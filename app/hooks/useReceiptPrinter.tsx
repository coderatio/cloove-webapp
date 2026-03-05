"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"
import { ReceiptData, ReceiptTemplate } from "@/app/components/shared/ReceiptTemplate"

export const useReceiptPrinter = () => {
    const printReceipt = React.useCallback(async (data: ReceiptData) => {
        // Create a hidden iframe
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
            console.error("Could not access iframe document")
            return
        }

        // Add basic styles to iframe
        const style = iframeDoc.createElement("style")
        style.textContent = `
            @page {
                margin: 0;
                size: 80mm auto;
            }
            body {
                margin: 0;
                padding: 0;
                background: white;
                display: flex;
                justify-content: center;
                align-items: flex-start;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    display: block;
                    width: 80mm;
                    margin: 0 auto;
                }
            }
            /* Ensure the receipt doesn't overflow the 80mm width */
            .receipt-container {
                width: 80mm;
                min-height: 100vh;
                background: white;
            }
        `
        iframeDoc.head.appendChild(style)

        // Add Tailwind/Globals CSS if needed (optional since we use inline styles for printable areas)
        // For a more robust solution, we can copy the stylesheets from the main document
        const links = document.querySelectorAll('link[rel="stylesheet"]')
        links.forEach(link => {
            const clone = link.cloneNode(true)
            iframeDoc.head.appendChild(clone)
        })

        // Create a container for the React component
        const container = iframeDoc.createElement("div")
        iframeDoc.body.appendChild(container)

        // Render the ReceiptTemplate into the iframe
        const root = createRoot(container)
        root.render(<ReceiptTemplate data={data} className="receipt-container" />)

        // Wait for images/fonts to load and React to finish rendering
        await new Promise(resolve => setTimeout(resolve, 500))

        // Print
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()

        // Clean up after some time
        setTimeout(() => {
            document.body.removeChild(iframe)
        }, 1000)
    }, [])

    return { printReceipt }
}
