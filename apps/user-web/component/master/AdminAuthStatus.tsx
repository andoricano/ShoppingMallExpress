"use client";

import { useAdminAuthStore } from "@/store/useAdminAuth";

export function AdminAuthStatus() {
    const user =
        useAdminAuthStore(
            (state) => state.user,
        );

    const signOut =
        useAdminAuthStore(
            (state) => state.signOut,
        );

    const isLoggedIn =
        user !== null;

    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
                <p className="text-sm font-semibold text-slate-800">
                    관리자 로그인 상태
                </p>

                <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                    {isLoggedIn ? (
                        <p>Supabase Auth 계정</p>
                    ) : (
                        <p>로그인되어 있지 않습니다.</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${isLoggedIn
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                >
                    {isLoggedIn
                        ? "로그인됨"
                        : "로그인 안 됨"}
                </span>

                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={signOut}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        로그아웃
                    </button>
                )}
            </div>
        </div>
    );
}
