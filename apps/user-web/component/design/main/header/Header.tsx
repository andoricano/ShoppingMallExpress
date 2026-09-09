"use client";

import { useState } from "react";

import type {
    PageHeaderConfig,
} from "@mall/mall-page-viewer";
import { HeaderMenuItem, HeaderMenuMode } from "@mall/mall-page-viewer/src/types/mainPage";
import AdminMainHeaderMenuEditor from "./AdminMainHeaderMenuEditor";

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
    const [
        isEditorOpen,
        setIsEditorOpen,
    ] = useState(false);

    const updateConfig = (
        updater: (
            config: PageHeaderConfig,
        ) => PageHeaderConfig,
    ) => {
        // onChange(
        // updater(
        //     structuredClone(config),
        // ),
        // );
    };

    const updateMenuMode = (
        menuMode: HeaderMenuMode,
    ) => {
        updateConfig((current) => ({
            ...current,
            menuMode,
        }));
    };

    const toggleActive = () => {
        updateConfig((current) => ({
            ...current,
            isActive: !current.isActive,
        }));
    };

    const updateMenus = (
        menus: HeaderMenuItem[],
    ) => {
        updateConfig((current) => ({
            ...current,
            menus,
        }));
    };

    const addMenu = () => {
        const menu: HeaderMenuItem = {
            id: crypto.randomUUID(),
            title: "새 메뉴",
            href: "/",
        };

        updateMenus([
            ...config.menus,
            menu,
        ]);
    };

    const removeMenu = (
        menuId: string,
    ) => {
        updateMenus(
            config.menus.filter(
                (menu) =>
                    menu.id !== menuId,
            ),
        );
    };

    const updateMenu = (
        menuId: string,
        updater: (
            menu: HeaderMenuItem,
        ) => HeaderMenuItem,
    ) => {
        updateMenus(
            config.menus.map((menu) =>
                menu.id === menuId
                    ? updater(
                        structuredClone(
                            menu,
                        ),
                    )
                    : menu,
            ),
        );
    };

    const addChildMenu = (
        menuId: string,
    ) => {
        updateMenu(menuId, (menu) => ({
            ...menu,
            children: [
                ...(menu.children ?? []),
                {
                    id: crypto.randomUUID(),
                    title: "새 하위 메뉴",
                    href: "/",
                },
            ],
        }));
    };

    const removeChildMenu = (
        menuId: string,
        childId: string,
    ) => {
        updateMenu(menuId, (menu) => ({
            ...menu,
            children:
                menu.children?.filter(
                    (child) =>
                        child.id !== childId,
                ),
        }));
    };

    const updateChildMenu = (
        menuId: string,
        childId: string,
        updater: (
            menu: HeaderMenuItem,
        ) => HeaderMenuItem,
    ) => {
        updateMenu(menuId, (menu) => ({
            ...menu,
            children:
                menu.children?.map(
                    (child) =>
                        child.id === childId
                            ? updater(
                                structuredClone(
                                    child,
                                ),
                            )
                            : child,
                ),
        }));
    };

    return (
        <>
            {/* Header Section */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
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
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            {config.isActive
                                ? "비활성화"
                                : "활성화"}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setIsEditorOpen(
                                    true,
                                )
                            }
                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            헤더 편집
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    {config.menus.map(
                        (menu) => (
                            <div
                                key={menu.id}
                                className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                            >
                                {menu.title}

                                {menu.children &&
                                    menu.children.length >
                                    0 && (
                                        <span className="ml-1 text-xs text-slate-400">
                                            +
                                            {
                                                menu
                                                    .children
                                                    .length
                                            }
                                        </span>
                                    )}
                            </div>
                        ),
                    )}
                </div>
            </section>
            {isEditorOpen && (
                <AdminMainHeaderMenuEditor
                    config={config}
                    onChange={onChange}
                    onClose={() =>
                        setIsEditorOpen(false)
                    }
                />
            )}
        </>
    );
}