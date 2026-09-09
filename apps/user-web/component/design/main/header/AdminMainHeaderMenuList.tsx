// apps/user-web/component/design/main/header/AdminMainHeaderMenuList.tsx

"use client";

import { useState } from "react";



import AdminMainHeaderMenuEditor from "./AdminMainHeaderMenuEditor";
import { HeaderMenuItem } from "@mall/mall-page-viewer/src/types/mainPage";

interface AdminMainHeaderMenuListProps {
    menus: HeaderMenuItem[];

    onChange: (
        menus: HeaderMenuItem[],
    ) => void;
}

export default function AdminMainHeaderMenuList({
    menus,
    onChange,
}: AdminMainHeaderMenuListProps) {
    const [
        selectedMenuId,
        setSelectedMenuId,
    ] = useState<string | null>(null);

    const [
        isEditorOpen,
        setIsEditorOpen,
    ] = useState(false);

    const selectedMenu = menus.find(
        (menu) =>
            menu.id === selectedMenuId,
    );

    const handleSelectMenu = (
        menuId: string,
    ) => {
        setSelectedMenuId(menuId);
        setIsEditorOpen(false);
    };

    const handleUpdateMenu = (
        updatedMenu: HeaderMenuItem,
    ) => {
        onChange(
            menus.map((menu) =>
                menu.id === updatedMenu.id
                    ? updatedMenu
                    : menu,
            ),
        );
    };

    const handleDeleteMenu = (
        menuId: string,
    ) => {
        const nextMenus = menus.filter(
            (menu) =>
                menu.id !== menuId,
        );

        onChange(nextMenus);

        if (selectedMenuId === menuId) {
            setSelectedMenuId(
                nextMenus[0]?.id ?? null,
            );
            setIsEditorOpen(false);
        }
    };

    return (
        <div className="mt-6 space-y-4">
            {/* Menu List */}
            <div className="flex flex-wrap gap-2">
                {menus.map((menu) => (
                    <button
                        key={menu.id}
                        type="button"
                        onClick={() =>
                            handleSelectMenu(
                                menu.id,
                            )
                        }
                        className={
                            menu.id ===
                                selectedMenuId
                                ? "rounded-md border border-slate-900 bg-slate-100 px-3 py-2 text-sm text-slate-900"
                                : "rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        }
                    >
                        {menu.title}

                        {menu.children &&
                            menu.children.length >
                            0 && (
                                <span className="ml-1 text-xs text-slate-400">
                                    +{menu.children.length}
                                </span>
                            )}
                    </button>
                ))}
            </div>

            {/* Selected Menu */}
            {selectedMenu && (
                <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                {
                                    selectedMenu.title
                                }
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                선택된 메뉴를 편집합니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() =>
                                    handleDeleteMenu(
                                        selectedMenu.id,
                                    )
                                }
                                className="text-xs text-rose-500 transition-colors hover:text-rose-700"
                            >
                                삭제
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsEditorOpen(
                                        (current) =>
                                            !current,
                                    )
                                }
                                className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                            >
                                {isEditorOpen
                                    ? "편집 닫기"
                                    : "편집하기"}
                            </button>
                        </div>
                    </div>

                    {isEditorOpen && (
                        <AdminMainHeaderMenuEditor
                            menu={selectedMenu}
                            onChange={
                                handleUpdateMenu
                            }
                            onClose={() =>
                                setIsEditorOpen(
                                    false,
                                )
                            }
                        />
                    )}
                </div>
            )}

            {menus.length === 0 && (
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
                    등록된 메뉴가 없습니다.
                </div>
            )}
        </div>
    );
}