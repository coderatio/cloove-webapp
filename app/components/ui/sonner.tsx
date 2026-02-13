"use client"

import { Toaster as Sonner } from "sonner"
import { useTheme } from "next-themes"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            richColors
            expand={true}
            toastOptions={{
                classNames: {
                    toast: "group toast sonner-toast",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
