"use client";

import React from "react";

export interface AdminMenuItem {
    menuTitle: string;
    onClick: () => void;
}

interface AdminMenuProps {
    menu: AdminMenuItem[];
}

export const AdminMenu: React.FC<AdminMenuProps> = ({ menu }) => {
    return (
        <nav className="flex items-center gap-2">
            {menu.map((item, index) => (
                <button
                    key={`${item.menuTitle}-${index}`}
                    type="button"
                    onClick={item.onClick}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
                >
                    {item.menuTitle}
                </button>
            ))}
        </nav>
    );
};