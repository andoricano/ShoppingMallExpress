// app/mypage/page.tsx

"use client";

import { useRouter } from "next/navigation";

export default function MyPage() {
    const router = useRouter();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">
                마이페이지
            </h1>

            <button
                type="button"
                onClick={() =>
                    router.push(
                        "/mypage/history",
                    )
                }
                className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
                주문 이력
            </button>
        </div>
    );
}