// apps/user-web/app/main-page/[section]/page.tsx

"use client";

import { use, useEffect } from "react";

import { PageDesignWorkspace } from "@/component/design/main/PageDesignWorkspace";
import { useAdminPageConfig } from "@/hooks/design/useAdminPageConfig";

interface PageProps {
    params: Promise<{
        section: string;
    }>;
}

export default function DesignSectionPage({
    params,
}: PageProps) {
    const { section } = use(params);

    const {
        config,
        loading,
        error,
        fetchConfig,
    } = useAdminPageConfig();

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    if (
        section !== "header" &&
        section !== "hero" &&
        section !== "product" &&
        section !== "promotion" &&
        section !== "footer"
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                존재하지 않는 디자인 영역입니다.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                메인 페이지 설정을 불러오는 중입니다.
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center text-red-500">
                {error}
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                메인 페이지 설정이 없습니다.
            </div>
        );
    }

    return (
        <PageDesignWorkspace
            config={config}
            section={section}
        />
    );
}