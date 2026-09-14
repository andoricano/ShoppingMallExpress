// app/mypage/layout.tsx

"use client";

import type { ReactNode } from "react";

import type { PageHeaderConfig } from "@mall/mall-page-viewer";
import MainHeader from "@/components/mypage/header/MainHeader";

import { useClientAuthStore } from "@/store/useClientAuthStore";

interface MyPageLayoutProps {
    children: ReactNode;
}

export const myPageMock: {
    header: PageHeaderConfig;
} = {
    header: {
        isActive: true,
        menuMode: "NONE",
        menus: [],
    },
};

export default function MyPageLayout({
    children,
}: MyPageLayoutProps) {
    const authUserId =
        useClientAuthStore(
            (state) => state.authUserId,
        );

    const signOut =
        useClientAuthStore(
            (state) => state.signOut,
        );

    const handleNavigate = (
        path: string,
    ) => {
        window.location.href = path;
    };

    const isLoggedIn =
        Boolean(authUserId);

    return (
        <main className="min-h-screen bg-slate-50">
            {myPageMock.header.isActive && (
                <MainHeader
                    config={
                        myPageMock.header
                    }
                    isLoggedIn={
                        isLoggedIn
                    }
                    onNavigate={
                        handleNavigate
                    }
                    onLogout={signOut}
                />
            )}

            {children}
        </main>
    );
}