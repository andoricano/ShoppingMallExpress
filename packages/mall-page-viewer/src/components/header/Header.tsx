// packages/mall-page-viewer/src/components/header/Header.tsx

"use client";

import { useState } from "react";

import type { PageHeaderConfig } from "../../types/mainPage";
import UserAuthAction from "./UserAuthAction";

interface HeaderProps {
    config: PageHeaderConfig;

    isLoggedIn: boolean;

    cartItemCount?: number;
    wishlistItemCount?: number;

    onNavigate: (path: string) => void;
    onLogout?: () => void;
}

interface HeaderMenu {
    id: string;
    title: string;
    href: string;
    children?: HeaderMenu[];
}

const menuData: HeaderMenu[] = [
    {
        id: "menu-1",
        title: "신상품",
        href: "/products?categoryId=new",
    },
    {
        id: "menu-2",
        title: "여성",
        href: "/products?categoryId=women",
        children: [
            {
                id: "menu-2-1",
                title: "의류",
                href: "/products?categoryId=women-clothing",
            },
            {
                id: "menu-2-2",
                title: "신발",
                href: "/products?categoryId=women-shoes",
            },
        ],
    },
    {
        id: "menu-3",
        title: "남성",
        href: "/products?categoryId=men",
        children: [
            {
                id: "menu-3-1",
                title: "의류",
                href: "/products?categoryId=men-clothing",
            },
            {
                id: "menu-3-2",
                title: "신발",
                href: "/products?categoryId=men-shoes",
            },
        ],
    },
];

export default function Header({
    config,
    isLoggedIn,
    cartItemCount = 0,
    wishlistItemCount = 0,
    onNavigate,
    onLogout,
}: HeaderProps) {
    const [
        hoveredMenu,
        setHoveredMenu,
    ] = useState<string | null>(null);

    if (!config.isActive) {
        return null;
    }

    const menus = config.menuIds
        .map((menuId) =>
            menuData.find(
                (menu) => menu.id === menuId,
            ),
        )
        .filter(
            (menu): menu is HeaderMenu =>
                menu !== undefined,
        );

    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() =>
                                onNavigate("/")
                            }
                            className="text-xl font-bold tracking-wider text-neutral-900"
                        >
                            MALL
                        </button>
                    </div>

                    {/* Category Menu */}
                    <nav className="hidden space-x-8 md:flex">
                        {menus.map((menu) => (
                            <div
                                key={menu.id}
                                className="group relative py-5"
                                onMouseEnter={() =>
                                    setHoveredMenu(
                                        menu.id,
                                    )
                                }
                                onMouseLeave={() =>
                                    setHoveredMenu(
                                        null,
                                    )
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        onNavigate(
                                            menu.href,
                                        )
                                    }
                                    className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
                                >
                                    {menu.title}
                                </button>

                                {menu.children &&
                                    menu.children.length >
                                    0 &&
                                    hoveredMenu ===
                                    menu.id && (
                                        <div className="absolute left-0 top-full z-10 w-48 rounded-b-md border border-neutral-100 bg-white py-2 shadow-lg">
                                            {menu.children.map(
                                                (
                                                    child,
                                                ) => (
                                                    <button
                                                        key={
                                                            child.id
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            onNavigate(
                                                                child.href,
                                                            )
                                                        }
                                                        className="block w-full px-4 py-2 text-left text-xs text-neutral-600 transition-colors hover:bg-neutral-50"
                                                    >
                                                        {
                                                            child.title
                                                        }
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>
                        ))}
                    </nav>

                    {/* User */}
                    <UserAuthAction
                        isLoggedIn={
                            isLoggedIn
                        }
                        cartItemCount={
                            cartItemCount
                        }
                        wishlistItemCount={
                            wishlistItemCount
                        }
                        onNavigate={
                            onNavigate
                        }
                        onLogout={
                            onLogout
                        }
                    />
                </div>
            </div>
        </header>
    );
}