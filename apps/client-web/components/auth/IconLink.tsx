// components/common/UserAuthAction.tsx

"use client";

import Link from "next/link";
import {
    Heart,
    ShoppingCart,
    UserRound,
} from "lucide-react";

import { useClientAuthStore } from "@/store/useClientAuthStore";

interface UserAuthActionProps {
    isLoggedIn?: boolean;
    cartItemCount?: number;
    wishlistItemCount?: number;
    onLogout?: () => void;
}

interface IconLinkProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    count?: number;
}

function IconLink({
    href,
    label,
    icon,
    count = 0,
}: IconLinkProps) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="relative inline-flex items-center text-neutral-700 transition-colors hover:text-black"
        >
            {icon}

            {count > 0 && (
                <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-neutral-900 px-1 text-center text-[9px] font-bold leading-4 text-white">
                    {count}
                </span>
            )}
        </Link>
    );
}

export default function UserAuthAction({
    isLoggedIn = false,
    cartItemCount = 0,
    wishlistItemCount = 0,
    onLogout,
}: UserAuthActionProps) {
    const signOut = useClientAuthStore(
        (state) => state.signOut,
    );

    const handleLogout = async () => {
        await signOut();
        onLogout?.();
    };

    if (isLoggedIn) {
        return (
            <div className="flex items-center gap-5">
                <IconLink
                    href="/cart"
                    label="장바구니"
                    icon={
                        <ShoppingCart
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                    count={cartItemCount}
                />

                <IconLink
                    href="/wishlist"
                    label="관심상품"
                    icon={
                        <Heart
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                    count={wishlistItemCount}
                />

                <IconLink
                    href="/mypage"
                    label="마이페이지"
                    icon={
                        <UserRound
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                />

                <span className="h-4 w-px bg-neutral-200" />

                <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-neutral-500 transition-colors hover:text-black"
                >
                    로그아웃
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            <Link
                href="/auth"
                className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
                Google 로그인
            </Link>
        </div>
    );
}