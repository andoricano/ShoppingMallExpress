"use client";

import { useState } from "react";

import type { HeaderMenuItem } from "../../types/mainPage";

import MainMenuItem from "./MainMenuItem";
import MainMenuDropdown from "./MainMenuDropdown";

interface MainMenuProps {
    menus: HeaderMenuItem[];
    onNavigate: (path: string) => void;
}

export default function MainMenu({
    menus,
    onNavigate,
}: MainMenuProps) {
    const [
        openMenuId,
        setOpenMenuId,
    ] = useState<string | null>(null);

    return (
        <nav className="hidden space-x-8 md:flex">
            {menus.map((menu) => {
                const hasChildren =
                    Boolean(
                        menu.children &&
                        menu.children.length > 0,
                    );

                const isOpen =
                    openMenuId === menu.id;

                return (
                    <div
                        key={menu.id}
                        className="relative py-5"
                        onMouseEnter={() => {
                            if (hasChildren) {
                                setOpenMenuId(
                                    menu.id,
                                );
                            }
                        }}
                        onMouseLeave={() => {
                            setOpenMenuId(null);
                        }}
                    >
                        <MainMenuItem
                            menu={menu}
                            onNavigate={
                                onNavigate
                            }
                        />

                        {hasChildren &&
                            isOpen && (
                                <MainMenuDropdown
                                    items={
                                        menu.children!
                                    }
                                    onNavigate={
                                        onNavigate
                                    }
                                />
                            )}
                    </div>
                );
            })}
        </nav>
    );
}