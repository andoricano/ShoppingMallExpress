// hooks/mainPage/useAdminPageConfig.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type { PageConfig } from "@mall/mall-page-viewer";

const PAGE_CONFIG_API =
    "/api/page-config/main_page";

export type DesignEditorSection =
    | "HEADER"
    | "HERO"
    | "PRODUCT"
    | "PROMOTION"
    | "FOOTER";

export function useAdminPageConfig() {
    const [config, setConfig] =
        useState<PageConfig | null>(null);

    const [
        selectedEditor,
        setSelectedEditor,
    ] = useState<
        DesignEditorSection | null
    >(null);

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
                const res = await fetch(
                    PAGE_CONFIG_API,
                    {
                        method: "GET",
                    },
                );

                const result =
                    await res.json().catch(
                        () => null,
                    );

                if (!res.ok) {
                    throw new Error(
                        result?.message ||
                        "페이지 설정 조회에 실패했습니다.",
                    );
                }

                const nextConfig =
                    result?.data as PageConfig | null;

                setConfig(nextConfig);

                return nextConfig;
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "페이지 설정 조회에 실패했습니다.";

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
                            .catch(
                                () => null,
                            );

                    if (!res.ok) {
                        throw new Error(
                            result?.message ||
                            "페이지 설정 저장에 실패했습니다.",
                        );
                    }

                    const savedConfig =
                        result
                            ?.data as PageConfig;

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

    // ==========================================
    // Config 초기화
    // ==========================================

    const resetConfig =
        useCallback(() => {
            setConfig(null);
            setSelectedEditor(null);
            setError(null);

            return null;
        }, []);

    // ==========================================
    // Editor
    // ==========================================

    const openEditor =
        useCallback(
            (
                section: DesignEditorSection,
            ) => {
                setSelectedEditor(section);
            },
            [],
        );

    const closeEditor =
        useCallback(() => {
            setSelectedEditor(null);
        }, []);

    return {
        config,

        selectedEditor,

        loading,
        saving,
        error,

        fetchConfig,
        saveConfig,
        resetConfig,

        openEditor,
        closeEditor,
    };
}