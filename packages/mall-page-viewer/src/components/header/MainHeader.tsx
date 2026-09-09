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
                <div className="flex h-16 items-center">
                    {/* Logo */}
                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => onNavigate("/")}
                            className="text-xl font-bold tracking-wider text-neutral-900"
                        >
                            MALL
                        </button>
                    </div>

                    {/* Main Menu - flex-1과 min-w-0, h-full 적용 */}
                    <div className="relative ml-12 flex-1 min-w-0 h-full flex items-center">
                        <MainMenu
                            menus={config.menus}
                            menuMode={config.menuMode}
                            onNavigate={onNavigate}
                        />
                    </div>

                    {/* User */}
                    <div className="ml-8 shrink-0">
                        <UserAuthAction
                            isLoggedIn={isLoggedIn}
                            cartItemCount={cartItemCount}
                            wishlistItemCount={wishlistItemCount}
                            onNavigate={onNavigate}
                            onLogout={onLogout}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}