// packages/mall-page-viewer/src/components/header/Header.tsx

"use client";

import type { PageHeaderConfig } from "../../types/mainPage";

import MainMenu from "./MainMenu";
import UserAuthAction from "./UserAuthAction";

interface MainHeaderProps {
    config: PageHeaderConfig;

    isLoggedIn: boolean;

    cartItemCount?: number;
    wishlistItemCount?: number;

    onNavigate: (path: string) => void;
    onLogout?: () => void;
}

export default function MainHeader({
    config,
    isLoggedIn,
    cartItemCount = 0,
    wishlistItemCount = 0,
    onNavigate,
    onLogout,
}: MainHeaderProps) {
    if (!config.isActive) {
        return null;
    }

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

                    {/* Main Menu */}
                    <MainMenu
                        menus={config.menus}
                        onNavigate={onNavigate}
                    />

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