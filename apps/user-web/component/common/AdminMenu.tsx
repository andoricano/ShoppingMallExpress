"use client";

import React from "react";

export type AdminMenuVariant =
    | "default"
    | "primary"
    | "danger"
    | "warning";

export interface AdminMenuItem {
    menuTitle: string;
    onClick: () => void;

    /**
     * 메뉴 비활성화
     */
    disabled?: boolean;

    /**
     * 잠금 상태
     *
     * true일 경우 클릭할 수 없으며
     * 잠금 표시가 나타납니다.
     */
    locked?: boolean;

    /**
     * 메뉴 색상 스타일
     */
    variant?: AdminMenuVariant;
}

interface AdminMenuProps {
    menu: AdminMenuItem[];
}

const variantClassName: Record<
    AdminMenuVariant,
    string
> = {
    default:
        "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100",
    primary:
        "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950",
    danger:
        "border-rose-200 bg-white text-rose-600 hover:bg-rose-50 active:bg-rose-100",
    warning:
        "border-amber-200 bg-white text-amber-700 hover:bg-amber-50 active:bg-amber-100",
};

export const AdminMenu: React.FC<
    AdminMenuProps
> = ({ menu }) => {
    return (
        <nav className="flex items-center gap-2">
            {menu.map((item, index) => {
                const isDisabled =
                    item.disabled ||
                    item.locked;

                return (
                    <button
                        key={`${item.menuTitle}-${index}`}
                        type="button"
                        onClick={() => {
                            if (isDisabled) {
                                return;
                            }

                            item.onClick();
                        }}
                        disabled={isDisabled}
                        className={[
                            "inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors",
                            variantClassName[
                            item.variant ??
                            "default"
                            ],
                            isDisabled
                                ? "cursor-not-allowed opacity-50 hover:bg-inherit active:bg-inherit"
                                : "cursor-pointer",
                        ].join(" ")}
                    >
                        {item.locked && (
                            <span
                                aria-hidden="true"
                                className="text-xs"
                            >
                                🔒
                            </span>
                        )}

                        {item.menuTitle}
                    </button>
                );
            })}
        </nav>
    );
};