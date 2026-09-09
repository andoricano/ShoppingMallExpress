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
            onClick={() => onNavigate(menu.href)}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none"
        >
            {menu.title}
        </button>
    );
}