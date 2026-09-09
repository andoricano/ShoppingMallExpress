// packages/mall-page-viewer/src/components/header/MainMenuDropdown.tsx

"use client";

import type { HeaderMenuItem } from "../../types/mainPage";

import MainMenuDropdownItem from "./MainMenuDropdownItem";

interface MainMenuDropdownProps {
    items: HeaderMenuItem[];
    onNavigate: (path: string) => void;
}

export default function MainMenuDropdown({
    items,
    onNavigate,
}: MainMenuDropdownProps) {
    return (
        <div className="absolute left-0 top-full z-10 w-48 rounded-b-md border border-neutral-100 bg-white py-2 shadow-lg">
            {items.map((item) => (
                <MainMenuDropdownItem
                    key={item.id}
                    menu={item}
                    onNavigate={onNavigate}
                />
            ))}
        </div>
    );
}