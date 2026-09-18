// app/mypage/layout.tsx

"use client";

import type { ReactNode } from "react";

interface MyPageLayoutProps {
    children: ReactNode;
}

export default function MyPageLayout({
    children,
}: MyPageLayoutProps) {
    return (
        <main className="min-h-screen bg-slate-50">
            {children}
        </main>
    );
}