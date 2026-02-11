"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { ReactNode, useRef } from "react"
import { cn } from "@/app/lib/utils"

interface MagneticButtonProps {
    children: ReactNode
    className?: string
    onClick?: () => void
    disabled?: boolean
}

export function MagneticButton({
    children,
    className,
    onClick,
    disabled
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 })
    const mouseY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 })

    // Transform for text/content to move slightly more for parallax effect
    const contentX = useTransform(mouseX, (value) => value * 0.2)
    const contentY = useTransform(mouseY, (value) => value * 0.2)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e
        const { height, width, left, top } = ref.current!.getBoundingClientRect()

        const middleX = clientX - (left + width / 2)
        const middleY = clientY - (top + height / 2)

        x.set(middleX)
        y.set(middleY)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: mouseX, y: mouseY }}
            onClick={onClick}
            className={cn(
                "relative cursor-pointer overflow-hidden rounded-full transition-colors",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                className
            )}
        >
            <motion.div
                style={{ x: contentX, y: contentY }}
                className="relative z-10 w-full h-full flex items-center justify-center"
            >
                {children}
            </motion.div>
        </motion.div>
    )
}
