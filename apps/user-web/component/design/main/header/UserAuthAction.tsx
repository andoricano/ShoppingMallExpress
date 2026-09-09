// packages/mall-page-viewer/src/components/Header/UserAuthAction.tsx

"use client";

import type { ReactNode } from "react";
import {
    Heart,
    ShoppingCart,
    UserRound,
} from "lucide-react";

interface UserAuthActionProps {
    isLoggedIn?: boolean;

    cartItemCount?: number;
    wishlistItemCount?: number;

    onNavigate: (path: string) => void;
    onLogout?: () => void;
}

interface IconActionProps {
    label: string;
    icon: ReactNode;
    count?: number;

    onClick: () => void;
}

function IconAction({
    label,
    icon,
    count = 0,
    onClick,
}: IconActionProps) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="relative inline-flex items-center text-neutral-700 transition-colors hover:text-black"
        >
            {icon}

            {count > 0 && (
                <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-neutral-900 px-1 text-center text-[9px] font-bold leading-4 text-white">
                    {count}
                </span>
            )}
        </button>
    );
}

export default function UserAuthAction({
    isLoggedIn = false,
    cartItemCount = 0,
    wishlistItemCount = 0,
    onNavigate,
    onLogout,
}: UserAuthActionProps) {
    if (isLoggedIn) {
        return (
            <div className="flex items-center gap-5 text-sm font-medium text-neutral-700">
                <IconAction
                    label="장바구니"
                    icon={
                        <ShoppingCart
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                    count={cartItemCount}
                    onClick={() =>
                        onNavigate("/cart")
                    }
                />

                <IconAction
                    label="관심상품"
                    icon={
                        <Heart
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                    count={wishlistItemCount}
                    onClick={() =>
                        onNavigate(
                            "/wishlist",
                        )
                    }
                />

                <IconAction
                    label="마이페이지"
                    icon={
                        <UserRound
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                    onClick={() =>
                        onNavigate("/mypage")
                    }
                />

                <span className="h-4 w-px bg-neutral-200" />

                <button
                    type="button"
                    onClick={onLogout}
                    className="text-xs text-neutral-500 transition-colors hover:text-black"
                >
                    로그아웃
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center text-sm font-medium">
            <button
                type="button"
                onClick={() =>
                    onNavigate("/auth")
                }
                className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
                Google 로그인
            </button>
        </div>
    );
}