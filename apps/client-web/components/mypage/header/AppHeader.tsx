"use client";

import { mainPageMock } from "@mall/mall-page-viewer";

import MainHeader from "./MainHeader";

import { useClientAuthStore } from "@/store/useClientAuthStore";

export function AppHeader() {
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
        <MainHeader
            config={mainPageMock.header}
            isLoggedIn={isLoggedIn}
            onNavigate={handleNavigate}
            onLogout={signOut}
        />
    );
}