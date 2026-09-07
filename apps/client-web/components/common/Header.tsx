"use client";

import Link from "next/link";
import { useState } from "react";
import type { MainHeaderConfig } from "@mall/types";
import UserAuthAction from "../auth/UserAuthAction";
import { useClientAuthStore } from "@/store/useClientAuthStore";

interface HeaderProps {
    config: MainHeaderConfig;
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

export default function Header({ config }: HeaderProps) {
    const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

    const user = useClientAuthStore(
        (state) => state.user,
    );

    const isLoggedIn = user !== null;
    if (!config.isActive) {
        return null;
    }

    const menus = config.menuIds
        .map((menuId) =>
            menuData.find((menu) => menu.id === menuId)
        )
        .filter((menu): menu is HeaderMenu => !!menu);

    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="shrink-0">
                        <Link
                            href="/"
                            className="text-xl font-bold tracking-wider text-neutral-900"
                        >
                            MALL
                        </Link>
                    </div>

                    {/* Category Menu */}
                    <nav className="hidden md:flex space-x-8">
                        {menus.map((menu) => (
                            <div
                                key={menu.id}
                                className="group relative py-5"
                                onMouseEnter={() =>
                                    setHoveredMenu(menu.id)
                                }
                                onMouseLeave={() =>
                                    setHoveredMenu(null)
                                }
                            >
                                <Link
                                    href={menu.href}
                                    className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
                                >
                                    {menu.title}
                                </Link>

                                {menu.children &&
                                    menu.children.length > 0 &&
                                    hoveredMenu === menu.id && (
                                        <div className="absolute left-0 top-full z-10 w-48 rounded-b-md border border-neutral-100 bg-white py-2 shadow-lg">
                                            {menu.children.map(
                                                (child) => (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        className="block px-4 py-2 text-xs text-neutral-600 transition-colors hover:bg-neutral-50"
                                                    >
                                                        {child.title}
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>
                        ))}
                    </nav>

                    {/* User */}
                    <UserAuthAction
                        isLoggedIn={isLoggedIn}
                        cartItemCount={0}
                        onLogout={() => { }}
                    />
                </div>
            </div>
        </header>
    );
}