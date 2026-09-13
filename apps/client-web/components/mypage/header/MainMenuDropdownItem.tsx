// packages/mall-page-viewer/src/components/header/MainMenuDropdownItem.tsx

"use client";

import type { HeaderMenuItem } from "../../types/mainPage";

interface MainMenuDropdownItemProps {
    item: HeaderMenuItem;
    onNavigate: (path: string) => void;
}

export default function MainMenuDropdownItem({
    item,
    onNavigate,
}: MainMenuDropdownItemProps) {
    return (
        <button
            type="button"
            onClick={() =>
                onNavigate(item.href)
            }
            className="block w-full px-4 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        >
            {item.title}
        </button>
    );
}