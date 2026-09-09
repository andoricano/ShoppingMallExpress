// packages/mall-page-viewer/src/components/header/MainMenuItem.tsx

"use client";

import type { HeaderMenuItem } from "../../types/mainPage";

interface MainMenuItemProps {
    menu: HeaderMenuItem;
    onNavigate: (path: string) => void;
}

export default function MainMenuItem({
    menu,
    onNavigate,
}: MainMenuItemProps) {
    return (
        <button
            type="button"
            onClick={() =>
                onNavigate(menu.href)
            }
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
        >
            {menu.title}
        </button>
    );
}