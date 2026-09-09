// packages/mall-page-viewer/src/components/header/MainMenuDropdownItem.tsx

"use client";

import type { HeaderMenuItem } from "../../types/mainPage";

interface MainMenuDropdownItemProps {
    menu: HeaderMenuItem;
    onNavigate: (path: string) => void;
}

export default function MainMenuDropdownItem({
    menu,
    onNavigate,
}: MainMenuDropdownItemProps) {
    return (
        <button
            type="button"
            onClick={() =>
                onNavigate(menu.href)
            }
            className="block w-full px-4 py-2 text-left text-xs text-neutral-600 transition-colors hover:bg-neutral-50"
        >
            {menu.title}
        </button>
    );
}