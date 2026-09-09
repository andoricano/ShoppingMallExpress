// apps/user-web/component/design/main/header/AdminMainHeaderMenuEditor.tsx

"use client";

import type {
    PageHeaderConfig,
} from "@mall/mall-page-viewer";
import { HeaderMenuItem, HeaderMenuMode } from "@mall/mall-page-viewer/src/types/mainPage";

interface AdminMainHeaderMenuEditorProps {
    config: PageHeaderConfig;
    onChange: (
        updater: (
            header: PageHeaderConfig,
        ) => PageHeaderConfig,
    ) => void;
    onClose: () => void;
}

export default function AdminMainHeaderMenuEditor({
    config,
    onChange,
    onClose,
}: AdminMainHeaderMenuEditorProps) {
    const updateMenus = (
        menus: HeaderMenuItem[],
    ) => {
        onChange((current) => ({
            ...current,
            menus,
        }));
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
                        structuredClone(menu),
                    )
                    : menu,
            ),
        );
    };

    const addMenu = () => {
        updateMenus([
            ...config.menus,
            {
                id: crypto.randomUUID(),
                title: "새 메뉴",
                href: "/",
            },
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

    const updateMenuMode = (
        menuMode: HeaderMenuMode,
    ) => {
        onChange((current) => ({
            ...current,
            menuMode,
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Editor Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            헤더 편집
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                            메뉴 구성과 펼침 방식을 설정합니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-slate-400 transition-colors hover:text-slate-700"
                    >
                        닫기
                    </button>
                </div>

                {/* Editor Body */}
                <div className="overflow-y-auto p-6">
                    {/* Menu Mode */}
                    <div className="mb-8">
                        <h4 className="text-sm font-semibold text-slate-800">
                            메뉴 펼침 방식
                        </h4>

                        <div className="mt-3 flex gap-3">
                            {(
                                [
                                    "NONE",
                                    "MEGA",
                                ] as const
                            ).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() =>
                                        updateMenuMode(
                                            mode,
                                        )
                                    }
                                    className={
                                        config.menuMode ===
                                            mode
                                            ? "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                                            : "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                                    }
                                >
                                    {mode ===
                                        "NONE"
                                        ? "없음"
                                        : "Mega Menu"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Menus */}
                    <div>
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-800">
                                메뉴
                            </h4>

                            <button
                                type="button"
                                onClick={addMenu}
                                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                            >
                                메뉴 추가
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {config.menus.map(
                                (menu) => (
                                    <div
                                        key={
                                            menu.id
                                        }
                                        className="rounded-lg border border-slate-200 p-4"
                                    >
                                        {/* Main Menu */}
                                        <div className="flex gap-3">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        menu.title
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateMenu(
                                                            menu.id,
                                                            (
                                                                current,
                                                            ) => ({
                                                                ...current,
                                                                title: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                                    placeholder="메뉴 이름"
                                                />

                                                <input
                                                    type="text"
                                                    value={
                                                        menu.href
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateMenu(
                                                            menu.id,
                                                            (
                                                                current,
                                                            ) => ({
                                                                ...current,
                                                                href: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                                    placeholder="경로"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeMenu(
                                                        menu.id,
                                                    )
                                                }
                                                className="self-start text-xs text-rose-500 transition-colors hover:text-rose-700"
                                            >
                                                삭제
                                            </button>
                                        </div>

                                        {/* Children */}
                                        <div className="mt-4 border-t border-slate-100 pt-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-600">
                                                    하위 메뉴
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addChildMenu(
                                                            menu.id,
                                                        )
                                                    }
                                                    className="text-xs text-slate-500 transition-colors hover:text-slate-900"
                                                >
                                                    + 추가
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {menu.children?.map(
                                                    (
                                                        child,
                                                    ) => (
                                                        <div
                                                            key={
                                                                child.id
                                                            }
                                                            className="flex gap-2"
                                                        >
                                                            <input
                                                                type="text"
                                                                value={
                                                                    child.title
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateChildMenu(
                                                                        menu.id,
                                                                        child.id,
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            title: event
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                                                placeholder="하위 메뉴 이름"
                                                            />

                                                            <input
                                                                type="text"
                                                                value={
                                                                    child.href
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateChildMenu(
                                                                        menu.id,
                                                                        child.id,
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            href: event
                                                                                .target
                                                                                .value,
                                                                        }),
                                                                    )
                                                                }
                                                                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                                                placeholder="경로"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeChildMenu(
                                                                        menu.id,
                                                                        child.id,
                                                                    )
                                                                }
                                                                className="px-2 text-xs text-rose-500 transition-colors hover:text-rose-700"
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}