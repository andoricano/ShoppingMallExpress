"use client";

import {
    useCallback,
    useState,
} from "react";


import { mainPageMock, type PageConfig } from "@mall/mall-page-viewer";

export type DesignEditorSection =
    | "HEADER"
    | "HERO"
    | "PRODUCT"
    | "PROMOTION"
    | "FOOTER";

// Mall v2 has no confirmed page-config table/RPC contract, and the legacy
// Express `/api/page-config` endpoint was removed. The editor works on a local
// copy of `mainPageMock` only; persistence stays disabled until a contract exists.
const PAGE_CONFIG_UNSUPPORTED_MESSAGE =
    "메인 페이지 설정 저장은 Mall v2 contract가 확정되지 않아 지원되지 않습니다.";

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

    // No remote load/save is performed; kept for the page contract.
    const loading = false;
    const saving = false;

    const [error, setError] =
        useState<string | null>(null);


    // ==========================================
    // Config 조회
    // ==========================================
    const loadConfig = useCallback(
        async () => {
            const mockConfig =
                structuredClone(mainPageMock);

            setConfig(mockConfig);
            setOriginalConfig(
                structuredClone(mockConfig),
            );
            setIsMock(true);
            setIsDirty(false);
            setError(null);

            return mockConfig;
        },
        [],
    );

    // ==========================================
    // Config 저장
    // ==========================================

    const saveConfig = useCallback<
        (nextConfig: PageConfig) => Promise<PageConfig | null>
    >(
        async () => {
            setError(PAGE_CONFIG_UNSUPPORTED_MESSAGE);

            return null;
        },
        [],
    );

    const updateConfig = useCallback(
        (nextConfig: PageConfig) => {
            setConfig(nextConfig);
            setIsDirty(true);
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
        setIsDirty(false);

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
