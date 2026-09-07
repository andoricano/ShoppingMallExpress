// app/auth/login/page.tsx

"use client";

import { AuthLoginSection } from "@/components/auth/AuthLoginSection";
import { useClientAuthStore } from "@/store/useClientAuthStore";

export default function ClientLoginPage() {
    const signInWithGoogle =
        useClientAuthStore(
            (state) =>
                state.signInWithGoogle,
        );

    const loading =
        useClientAuthStore(
            (state) => state.loading,
        );

    const error =
        useClientAuthStore(
            (state) => state.error,
        );

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <AuthLoginSection
                loading={loading}
                error={error}
                onGoogleLogin={
                    signInWithGoogle
                }
            />
        </main>
    );
}