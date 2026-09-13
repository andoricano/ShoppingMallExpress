// packages/mall-page-viewer/src/components/Header/UserAuthAction.tsx

"use client";

import {
    Heart,
    ShoppingCart,
    UserRound,
} from "lucide-react";

interface UserAuthActionProps {
    isLoggedIn?: boolean;

    onNavigate: (path: string) => void;
    onLogout?: () => void;
}

interface IconActionProps {
    label: string;
    icon: React.ReactNode;

    onClick: () => void;
}

function IconAction({
    label,
    icon,
    onClick,
}: IconActionProps) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            style={{ cursor: "pointer" }}
            className="inline-flex items-center text-neutral-700 transition-colors hover:text-black"
        >
            {icon}
        </button>
    );
}

export default function UserAuthAction({
    isLoggedIn = false,
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
                    onClick={() =>
                        onNavigate(
                            "/cart",
                        )
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
                        onNavigate(
                            "/mypage",
                        )
                    }
                />

                <span className="h-4 w-px bg-neutral-200" />

                <button
                    type="button"
                    onClick={onLogout}
                    className="cursor-pointer text-xs text-neutral-500 transition-colors hover:text-black"
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
                className="cursor-pointer rounded-md bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
                Google 로그인
            </button>
        </div>
    );
}