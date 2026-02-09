"use client"

import AppLayout from "@/app/components/layout/AppLayout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout>{children}</AppLayout>;
}
