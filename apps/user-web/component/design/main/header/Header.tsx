// apps/user-web/component/design/main/header/AdminMainHeader.tsx

"use client";

import type {
    PageHeaderConfig,
} from "@mall/mall-page-viewer";

import AdminMainHeaderMenuList from "./AdminMainHeaderMenuList";

interface AdminMainHeaderProps {
    config: PageHeaderConfig;

    onChange: (
        updater: (
            header: PageHeaderConfig,
        ) => PageHeaderConfig,
    ) => void;
}

export default function AdminMainHeader({
    config,
    onChange,
}: AdminMainHeaderProps) {
    const updateConfig = (
        updater: (
            config: PageHeaderConfig,
        ) => PageHeaderConfig,
    ) => {
        onChange((current) =>
            updater(
                structuredClone(current),
            ),
        );
    };

    const toggleActive = () => {
        updateConfig((current) => ({
            ...current,
            isActive: !current.isActive,
        }));
    };

    const updateMenus = (
        menus: PageHeaderConfig["menus"],
    ) => {
        updateConfig((current) => ({
            ...current,
            menus,
        }));
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        헤더
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        메인 페이지의 메뉴 구성을 관리합니다.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={
                            config.isActive
                                ? "text-sm text-emerald-600"
                                : "text-sm text-slate-400"
                        }
                    >
                        {config.isActive
                            ? "활성"
                            : "비활성"}
                    </span>

                    <button
                        type="button"
                        onClick={toggleActive}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        {config.isActive
                            ? "비활성화"
                            : "활성화"}
                    </button>
                </div>
            </div>

            {/* Menu List */}
            <AdminMainHeaderMenuList
                menus={config.menus}
                onChange={updateMenus}
            />
        </section>
    );
}