// apps/user-web/component/design/main/header/AdminMainHeaderMenuList.tsx

"use client";

import { HeaderMenuItem } from "@mall/mall-page-viewer/src/types/mainPage";


interface AdminMainHeaderMenuListProps {
    menus: HeaderMenuItem[];
}

export default function AdminMainHeaderMenuList({
    menus,
}: AdminMainHeaderMenuListProps) {
    return (
        <div className="mt-6 flex flex-wrap gap-2">
            {menus.map((menu) => (
                <div
                    key={menu.id}
                    className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                    {menu.title}

                    {menu.children &&
                        menu.children.length > 0 && (
                            <span className="ml-1 text-xs text-slate-400">
                                +{menu.children.length}
                            </span>
                        )}
                </div>
            ))}
        </div>
    );
}