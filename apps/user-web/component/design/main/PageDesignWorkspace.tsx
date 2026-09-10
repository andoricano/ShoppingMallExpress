// apps/user-web/component/design/main/PageDesignWorkspace.tsx

"use client";

import type {
    PageConfig,
} from "@mall/mall-page-viewer";

import { usePageEditor } from "@/hooks/design/usePageEditor";

import MainPagePreview from "@/component/design/main/MainPagePreview";
import DesignSidebar from "./DeisgnSidebar";

interface PageDesignWorkspaceProps {
    config: PageConfig;
}

export function PageDesignWorkspace({
    config,
}: PageDesignWorkspaceProps) {
    const {
        config: editingConfig,
    } = usePageEditor({
        initialConfig: config,
    });

    return (
        <div className="flex min-h-screen overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* Sidebar */}
            <DesignSidebar />

            {/* Preview */}
            <main className="min-w-0 flex-1 overflow-auto bg-slate-100 p-6">
                <MainPagePreview
                    config={editingConfig}
                />
            </main>
        </div>
    );
}