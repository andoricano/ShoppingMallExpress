// apps/user-web/app/(admin)/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAdminAuthStore } from "@/store/useAdminAuth";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const user = useAdminAuthStore(
        (state) => state.user,
    );

    const authInitialized =
        useAdminAuthStore(
            (state) => state.authInitialized,
        );

    useEffect(() => {
        if (
            authInitialized &&
            !user
        ) {
            router.replace(
                "/admin-login",
            );
        }
    }, [
        authInitialized,
        user,
        router,
    ]);

    if (!authInitialized) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                관리자 인증을 확인하는 중입니다.
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}