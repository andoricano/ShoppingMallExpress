// hooks/mainPage/useAdminPageConfig.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import {
    mainPageMock,
    type PageConfig,
} from "@mall/mall-page-viewer";

export function useAdminPageConfig() {
    const [config, setConfig] =
        useState<PageConfig | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    // ==========================================
    // Config 조회
    // ==========================================

    const fetchConfig =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                // TODO:
                // 추후 GET API 연결
                // const res = await fetch(...);

                const mockConfig: PageConfig =
                    structuredClone(
                        mainPageMock,
                    );

                setConfig(mockConfig);

                return mockConfig;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "메인 페이지 설정 조회에 실패했습니다.";

                setError(message);

                return null;
            } finally {
                setLoading(false);
            }
        }, []);

    // ==========================================
    // Config 저장
    // ==========================================

    const saveConfig =
        useCallback(
            async (
                nextConfig: PageConfig,
            ) => {
                setSaving(true);
                setError(null);

                try {
                    // TODO:
                    // 추후 PATCH / PUT API 연결
                    // await fetch(...);

                    const savedConfig =
                        structuredClone(
                            nextConfig,
                        );

                    setConfig(savedConfig);

                    return savedConfig;
                } catch (err) {
                    const message =
                        err instanceof Error
                            ? err.message
                            : "메인 페이지 설정 저장에 실패했습니다.";

                    setError(message);

                    throw err;
                } finally {
                    setSaving(false);
                }
            },
            [],
        );

    // ==========================================
    // Config 초기화
    // ==========================================

    const resetConfig =
        useCallback(() => {
            const reset =
                structuredClone(
                    mainPageMock,
                );

            setConfig(reset);
            setError(null);

            return reset;
        }, []);

    return {
        config,

        loading,
        saving,
        error,

        fetchConfig,
        saveConfig,
        resetConfig,
    };
}