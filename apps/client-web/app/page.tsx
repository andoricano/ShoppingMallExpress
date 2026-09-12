// apps/client-web/app/page.tsx

"use client";

import { useEffect } from "react";

import {
    mainPageMock,
} from "@mall/mall-page-viewer";

import MainPage from "@/components/home/MainPage";
import { useProductPost } from "@/hooks/useProductPost";

export default function HomePage() {
    const {
        postList,
        loading,
        error,
        fetchPosts,
    } = useProductPost();

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return (
        <main className="min-h-screen">
            <MainPage
                config={mainPageMock}
                postList={postList}
                loading={loading}
                error={error}
            />
        </main>
    );
}