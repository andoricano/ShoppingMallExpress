"use client";

import { useClientAuthStore } from "@/store/useClientAuthStore";
import { useRouter } from "next/navigation";


export default function MyPage() {
    const router = useRouter();

    const user =
        useClientAuthStore(
            (state) => state.user,
        );

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">
                마이페이지
            </h1>

            <pre className="mt-6 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-white">
                {JSON.stringify(
                    user,
                    null,
                    2,
                )}
            </pre>

            <div className="mt-6 flex gap-3">
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/mypage/history",
                        )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    주문 이력
                </button>

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/mypage/point",
                        )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Point 테스트
                </button>
            </div>
        </div>
    );
}