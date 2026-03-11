"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { apiClient } from "@/app/lib/api-client"

interface SignupConfig {
    signupEnabled: boolean
}

export function LoginSignupLink() {
    const [signupEnabled, setSignupEnabled] = useState<boolean | null>(null)

    useEffect(() => {
        apiClient
            .get<SignupConfig>("/security/signup-config")
            .then((data) => setSignupEnabled(data.signupEnabled))
            .catch(() => setSignupEnabled(false))
    }, [])

    if (signupEnabled !== true) return null

    return (
        <p className="mt-8 text-center text-brand-cream/50 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-gold hover:underline">
                Sign up
            </Link>
        </p>
    )
}
