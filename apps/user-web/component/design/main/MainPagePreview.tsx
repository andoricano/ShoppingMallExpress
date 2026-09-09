// apps/user-web/component/design/main/MainPagePreview.tsx

"use client";

import React from "react";

import {
    MallTemplate,
    mainPageMock,
} from "@mall/mall-page-viewer";

export default function MainPagePreview() {
    const handleNavigate = (path: string) => {
        window.location.href = path;
    };

    return (
        <MallTemplate
            config={mainPageMock}
            isLoggedIn={false}
            cartItemCount={0}
            wishlistItemCount={0}
            onNavigate={handleNavigate}
        />
    );
}