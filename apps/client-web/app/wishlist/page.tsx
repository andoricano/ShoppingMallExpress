"use client";

import WishlistBox from "@/components/wishlist/WishlistBox";
import { useWishlist } from "@/hooks/user/useWishlist";

export default function WishlistPage() {
    const {
        wishlist,
        loading,
        error,
        removeWishlist,
    } = useWishlist();

    const handleItemClick = (
        productPostId: string,
    ) => {
        window.location.href =
            `/products/${productPostId}`;
    };

    const handleRemove = async (
        productPostId: string,
    ) => {
        await removeWishlist(
            productPostId,
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                Wishlist 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-red-600">
                {error}
            </div>
        );
    }

    return (
        <main className="min-h-screen px-6 py-10">
            <div className="mx-auto w-full max-w-7xl">
                <WishlistBox
                    items={wishlist}
                    onItemClick={
                        handleItemClick
                    }
                    onRemove={
                        handleRemove
                    }
                />
            </div>
        </main>
    );
}