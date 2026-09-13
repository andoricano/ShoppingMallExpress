// app/mypage/layout.tsx

import type { ReactNode } from "react";

interface MyPageLayoutProps {
    children: ReactNode;
}

export default function MyPageLayout({
    children,
}: MyPageLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-100">
            <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
}