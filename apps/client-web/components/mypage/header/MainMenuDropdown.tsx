"use client";

import { HeaderMenuItem, HeaderMenuMode } from "@mall/mall-page-viewer/src/types/mainPage";


interface MainMenuDropdownProps {
    menu: HeaderMenuItem;
    menuMode: HeaderMenuMode;
    onNavigate: (path: string) => void;
}

export default function MainMenuDropdown({
    menu,
    menuMode,
    onNavigate,
}: MainMenuDropdownProps) {
    if (
        menuMode !== "MEGA" ||
        !menu.children ||
        menu.children.length === 0
    ) {
        return null;
    }

    return (
        <div className="absolute left-0 top-full z-50 w-full border-t border-neutral-200 bg-white shadow-xl">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {menu.children.map(
                        (child) => (
                            <button
                                key={child.id}
                                type="button"
                                onClick={() =>
                                    onNavigate(
                                        child.href,
                                    )
                                }
                                className="rounded-md px-3 py-2 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                            >
                                {child.title}
                            </button>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}