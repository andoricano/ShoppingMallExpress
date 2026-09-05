// app/auth/login/page.tsx

"use client";

import { useClientAuth } from "@/hooks/useClientAuth";



export default function ClientLoginPage() {
    const {
        signInWithGoogle,
        loading,
        error,
    } = useClientAuth();

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        MALL
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        쇼핑몰에 오신 것을
                        환영합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        signInWithGoogle
                    }
                    disabled={loading}
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="text-base font-bold">
                        G
                    </span>

                    {loading
                        ? "로그인 중..."
                        : "Google로 시작하기"}
                </button>

                {error && (
                    <p className="mt-4 text-center text-sm text-red-600">
                        {error}
                    </p>
                )}
            </section>
        </main>
    );
}