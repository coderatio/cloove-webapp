"use client"
import { use } from "react"
import { CheckoutPage } from "@/app/domains/checkout/components/CheckoutPage"

export default function PayPage({ params }: { params: Promise<{ reference: string }> }) {
    const { reference } = use(params)
    return <CheckoutPage reference={reference} />
}
