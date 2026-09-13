// apps/user-web/app/admin-login/page.tsx

"use client";

import { useState } from "react";

import { useAdminAuthStore } from "@/store/useAdminAuth";

export default function AdminLoginPage() {
    const thirdPartySignIn =
        useAdminAuthStore(
            (state) => state.thirdPartySignIn,
        );

    const [loading, setLoading] =
        useState(false);

    const handleGoogleLogin =
        async () => {
            setLoading(true);

            try {
                await thirdPartySignIn(
                    "google",
                );
            } catch (error) {
                console.error(
                    "[AdminLogin] Google 로그인 실패:",
                    error,
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Admin Login
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        관리자 계정으로 로그인해주세요.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        handleGoogleLogin
                    }
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "로그인 중..."
                        : "Google로 로그인"}
                </button>
            </div>
        </main>
    );
}