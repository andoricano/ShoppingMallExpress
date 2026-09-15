"use client";

import { useWishlist } from "@/hooks/user/useWishlist";
import { useEffect } from "react";


export default function WishlistPage() {
    const {
        wishlist,
        loading,
        error,
        fetchWishlist,
        removeWishlist,
    } = useWishlist();

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

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
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold">
                관심상품
            </h1>

            {wishlist.length === 0 ? (
                <p className="text-sm text-slate-500">
                    관심상품이 없습니다.
                </p>
            ) : (
                <div className="space-y-3">
                    {wishlist.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
                        >
                            <div>
                                <p className="font-medium text-slate-900">
                                    {item.product.name}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {item.product.price.toLocaleString(
                                        "ko-KR",
                                    )}
                                    원
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    removeWishlist(
                                        item.productId,
                                    )
                                }
                                className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}