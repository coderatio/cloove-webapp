"use client"

import { useAuth } from "../providers/auth-provider"
import { SessionManager } from "./SessionManager"

/**
 * Explicitly exposes the session manager in the root layout
 * This is a separate client component to keep the root layout as a server component.
 */
export function RootSessionManager() {
    const { user, updateUserMetadata } = useAuth()

    if (!user) return null

    return (
        <SessionManager
            sessionMetadata={user.session}
            onSessionRefresh={updateUserMetadata}
        />
    )
}
