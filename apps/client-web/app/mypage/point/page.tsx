"use client";

import { MyPointSection } from "@/components/mypage/point/MyPointSection";

export default function PointPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="mx-auto max-w-3xl">
                <MyPointSection />
            </div>
        </div>
    );
}
