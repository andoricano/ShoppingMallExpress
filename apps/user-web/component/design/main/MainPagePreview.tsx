// apps/user-web/component/design/main/MainPagePreview.tsx

"use client";

import type { PageConfig } from "@mall/mall-page-viewer";

import {
    MallTemplate,
} from "@mall/mall-page-viewer";

interface MainPagePreviewProps {
    config: PageConfig;
}

export default function MainPagePreview({
    config,
}: MainPagePreviewProps) {
    const handleNavigate = (
        path: string,
    ) => {
        window.location.href = path;
    };

    return (
        <section className="overflow-hidden rounded-xl border-2 border-slate-600 bg-white">
            {/* Preview Header */}
            <div className="flex h-11 items-center border-b-2 border-slate-600 bg-slate-50 px-4">
                <span className="text-xs font-semibold text-slate-600">
                    Preview
                </span>
            </div>

            {/* Page */}
            <div className="overflow-auto">
                <MallTemplate
                    config={config}
                    isLoggedIn={false}
                    cartItemCount={0}
                    wishlistItemCount={0}
                    onNavigate={
                        handleNavigate
                    }
                />
            </div>
        </section>
    );
}