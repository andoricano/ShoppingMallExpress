// apps/user-web/hooks/design/usePageEditor.ts

"use client";

import { useCallback, useState } from "react";

import type {
    PageConfig,
} from "@mall/mall-page-viewer";

interface UsePageEditorOptions {
    initialConfig: PageConfig;
}

export function usePageEditor({
    initialConfig,
}: UsePageEditorOptions) {
    const [
        editingConfig,
        setEditingConfig,
    ] = useState<PageConfig>(() =>
        structuredClone(initialConfig),
    );

    // ==========================================
    // Config 변경
    // ==========================================

    const updateConfig = useCallback(
        (
            updater: (
                config: PageConfig,
            ) => PageConfig,
        ) => {
            setEditingConfig((current) =>
                updater(
                    structuredClone(current),
                ),
            );
        },
        [],
    );

    // ==========================================
    // Header
    // ==========================================

    const updateHeader = useCallback(
        (
            updater: (
                header: PageConfig["header"],
            ) => PageConfig["header"],
        ) => {
            updateConfig((current) => ({
                ...current,
                header: updater(
                    current.header,
                ),
            }));
        },
        [updateConfig],
    );

    // ==========================================
    // Hero
    // ==========================================

    const updateHero = useCallback(
        (
            updater: (
                hero: PageConfig["hero"],
            ) => PageConfig["hero"],
        ) => {
            updateConfig((current) => ({
                ...current,
                hero: updater(
                    current.hero,
                ),
            }));
        },
        [updateConfig],
    );

    // ==========================================
    // Sections
    // ==========================================

    const updateSections = useCallback(
        (
            updater: (
                sections: PageConfig["sections"],
            ) => PageConfig["sections"],
        ) => {
            updateConfig((current) => ({
                ...current,
                sections: updater(
                    current.sections,
                ),
            }));
        },
        [updateConfig],
    );

    // ==========================================
    // Footer
    // ==========================================

    const updateFooter = useCallback(
        (
            updater: (
                footer: PageConfig["footer"],
            ) => PageConfig["footer"],
        ) => {
            updateConfig((current) => ({
                ...current,
                footer: updater(
                    current.footer,
                ),
            }));
        },
        [updateConfig],
    );

    // ==========================================
    // Config 교체
    // ==========================================

    const replaceConfig = useCallback(
        (nextConfig: PageConfig) => {
            setEditingConfig(
                structuredClone(nextConfig),
            );
        },
        [],
    );

    // ==========================================
    // Config 초기화
    // ==========================================

    const resetConfig = useCallback(() => {
        setEditingConfig(
            structuredClone(initialConfig),
        );
    }, [initialConfig]);

    return {
        config: editingConfig,

        updateConfig,
        updateHeader,
        updateHero,
        updateSections,
        updateFooter,

        replaceConfig,
        resetConfig,
    };
}