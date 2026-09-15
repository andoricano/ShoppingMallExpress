// packages/mall-page-viewer/src/components/product/ProductPostActions.tsx

"use client";

import {
    Heart,
    ShoppingCart,
} from "lucide-react";

interface ProductPostActionsProps {
    isWishlisted?: boolean;

    onWishlistClick?: () => void;
    onCartClick?: () => void;
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
            className="inline-flex items-center text-neutral-700 transition-colors hover:text-black"
        >
            {icon}
        </button>
    );
}

export default function ProductPostActions({
    isWishlisted = false,
    onWishlistClick,
    onCartClick,
}: ProductPostActionsProps) {
    return (
        <div className="flex items-center gap-4">
            {onWishlistClick && (
                <IconAction
                    label="관심상품"
                    icon={
                        <Heart
                            className="h-5 w-5"
                            strokeWidth={1.8}
                            fill={
                                isWishlisted
                                    ? "currentColor"
                                    : "none"
                            }
                        />
                    }
                    onClick={
                        onWishlistClick
                    }
                />
            )}

            {onCartClick && (
                <IconAction
                    label="장바구니"
                    icon={
                        <ShoppingCart
                            className="h-5 w-5"
                            strokeWidth={1.8}
                        />
                    }
                    onClick={onCartClick}
                />
            )}
        </div>
    );
}