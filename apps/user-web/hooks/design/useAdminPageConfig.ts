"use client";

import {
    useCallback,
    useState,
} from "react";


import { mainPageMock, type PageConfig } from "@mall/mall-page-viewer";
import { API_ENDPOINTS } from "@mall/constants";

export type DesignEditorSection =
    | "HEADER"
    | "HERO"
    | "PRODUCT"
    | "PROMOTION"
    | "FOOTER";

const PAGE_CONFIG_API =
    `${API_ENDPOINTS.PAGE_CONFIG.BASE}/main_page`;

export function useAdminPageConfig() {
    const [config, setConfig] =
        useState<PageConfig | null>(null);

    const [originalConfig, setOriginalConfig] =
        useState<PageConfig | null>(null);

    const [isMock, setIsMock] =
        useState(false);

    const [isDirty, setIsDirty] =
        useState(false);

    const [selectedEditor, setSelectedEditor] =
        useState<DesignEditorSection | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);


    // ==========================================
    // Config 조회
    // ==========================================
    const loadConfig = useCallback(
        async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    PAGE_CONFIG_API,
                );

                const result =
                    await res
                        .json()
                        .catch(() => null);

                console.log(
                    "[PageConfig] API Response:",
                    result,
                );

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "페이지 설정 조회에 실패했습니다.",
                    );
                }

                const nextConfig =
                    result?.data as
                    | PageConfig
                    | null;

                console.log(
                    "[PageConfig] DB Config:",
                    nextConfig,
                );

                if (!nextConfig) {
                    const mockConfig =
                        structuredClone(mainPageMock);

                    console.log(
                        "[PageConfig] DB 데이터 없음 → Mock 사용:",
                        mockConfig,
                    );

                    setConfig(mockConfig);
                    setOriginalConfig(
                        structuredClone(mockConfig),
                    );
                    setIsMock(true);
                    setIsDirty(false);

                    return mockConfig;
                }

                setConfig(nextConfig);
                setOriginalConfig(
                    structuredClone(nextConfig),
                );
                setIsMock(false);
                setIsDirty(false);

                return nextConfig;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "페이지 설정 조회에 실패했습니다.";

                setError(message);
                setIsMock(false);

                return null;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    // ==========================================
    // Config 저장
    // ==========================================

    const saveConfig = useCallback(
        async (
            nextConfig: PageConfig,
        ) => {
            setSaving(true);
            setError(null);

            try {
                const res = await fetch(
                    PAGE_CONFIG_API,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify(
                            nextConfig,
                        ),
                    },
                );

                const result =
                    await res
                        .json()
                        .catch(() => null);

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "페이지 설정 저장에 실패했습니다.",
                    );
                }

                const savedConfig =
                    result.data as PageConfig;

                setConfig(savedConfig);
                setSelectedEditor(null);

                return savedConfig;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "페이지 설정 저장에 실패했습니다.";

                setError(message);

                throw err;
            } finally {
                setSaving(false);
            }
        },
        [],
    );

    const updateConfig = useCallback(
        (nextConfig: PageConfig) => {
            setConfig(nextConfig);
            setIsDirty(true);
            setIsMock(false);
        },
        [],
    );


    // ==========================================
    // Config 초기화
    // ==========================================

    const resetConfig = useCallback(() => {
        if (!originalConfig) {
            return null;
        }

        const reset =
            structuredClone(originalConfig);

        setConfig(reset);
        setSelectedEditor(null);
        setError(null);

        return reset;
    }, [originalConfig]);

    // ==========================================
    // Editor
    // ==========================================

    const openEditor = useCallback(
        (
            section: DesignEditorSection,
        ) => {
            setSelectedEditor(section);
        },
        [],
    );

    const closeEditor = useCallback(
        () => {
            setSelectedEditor(null);
        },
        [],
    );
    return {
        config,
        isMock,
        isDirty,

        selectedEditor,

        loading,
        saving,
        error,

        loadConfig,
        saveConfig,
        resetConfig,
        updateConfig,

        openEditor,
        closeEditor,
    };
}