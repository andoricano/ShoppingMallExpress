"use client";

import { useState } from "react";

import type {
    HeaderMenuItem,
    HeaderMenuMode,
} from "../../types/mainPage";

import MainMenuItem from "./MainMenuItem";
import MainMenuDropdown from "./MainMenuDropdown";

interface MainMenuProps {
    menus: HeaderMenuItem[];
    menuMode: HeaderMenuMode;
    onNavigate: (path: string) => void;
}

export default function MainMenu({
    menus,
    menuMode,
    onNavigate,
}: MainMenuProps) {
    const [
        hoveredMenuId,
        setHoveredMenuId,
    ] = useState<string | null>(null);

    const hoveredMenu = menus.find(
        (menu) =>
            menu.id === hoveredMenuId,
    );

    return (
        <div
            className="relative h-full w-full"
            onMouseLeave={() =>
                setHoveredMenuId(null)
            }
        >
            <nav className="flex h-full items-center justify-center gap-8 px-4 lg:gap-12">
                {menus.map((menu) => (
                    <div
                        key={menu.id}
                        className="flex h-full items-center py-4"
                        onMouseEnter={() => {
                            if (
                                menuMode === "MEGA" &&
                                menu.children &&
                                menu.children.length > 0
                            ) {
                                setHoveredMenuId(
                                    menu.id,
                                );
                            } else {
                                setHoveredMenuId(
                                    null,
                                );
                            }
                        }}
                    >
                        <MainMenuItem
                            menu={menu}
                            onNavigate={onNavigate}
                        />
                    </div>
                ))}
            </nav>

            {menuMode === "MEGA" &&
                hoveredMenu && (
                    <MainMenuDropdown
                        menu={hoveredMenu}
                        menuMode={menuMode}
                        onNavigate={onNavigate}
                    />
                )}
        </div>
    );
}