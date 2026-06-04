'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { Home01Icon as Home, Message01Icon as MessageSquare, File01Icon as FileText, UserMultiple02Icon as Users, PackageIcon as Package } from "@hugeicons/core-free-icons"
import * as Tooltip from '@radix-ui/react-tooltip'

const navItems = [
    { href: '/', icon: Home, label: 'Overview' },
    { href: '/assistant', icon: MessageSquare, label: 'Assistant' },
    { href: '/orders', icon: FileText, label: 'Orders' },
    { href: '/customers', icon: Users, label: 'Customers' },
    { href: '/inventory', icon: Package, label: 'Inventory' },
] as const

function NavLink({
    href,
    icon: Icon,
    label,
    isActive,
}: {
    href: string
    icon: IconSvgElement
    label: string
    isActive: boolean
}) {
    return (
        <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <Link
                        href={href}
                        className={`
                            w-11 h-11 flex items-center justify-center rounded-xl
                            transition-all duration-150 ease-out
                            ${isActive
                                ? 'bg-brand-gold/15 text-brand-gold'
                                : 'text-cream/60 hover:bg-cream/10 hover:text-cream'
                            }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={label}
                    >
                        <HugeiconsIcon icon={Icon} className="w-[22px] h-[22px]" strokeWidth={1.5} />
                    </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        side="right"
                        sideOffset={12}
                        className="
                            bg-surface px-3 py-1.5 rounded-lg
                            text-sm font-medium text-text-primary
                            shadow-lg border border-cloove-border
                            animate-in fade-in-0 zoom-in-95 duration-150
                        "
                    >
                        {label}
                        <Tooltip.Arrow className="fill-surface" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside
            className="
                w-[72px] h-screen fixed left-0 top-0 z-50
                bg-brand-deep
                flex flex-col items-center
                py-6
            "
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className="mb-8">
                <div className="
                    w-10 h-10 rounded-xl
                    bg-brand-gold/15
                    flex items-center justify-center
                ">
                    <span className="text-brand-gold font-semibold text-xl font-serif">
                        C
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col items-center flex-1 gap-1" role="navigation">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={pathname === item.href}
                    />
                ))}
            </nav>

            {/* User Avatar */}
            <div className="mt-auto">
                <div className="
                    w-10 h-10 rounded-full
                    bg-cream/10
                    flex items-center justify-center
                    text-sm font-medium text-cream/80
                    cursor-pointer
                    hover:bg-cream/15 transition-colors
                ">
                    AO
                </div>
            </div>
        </aside>
    )
}
