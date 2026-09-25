"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import WishlistBox from "@/components/wishlist/WishlistBox";
import {
    WISHLIST_LOGIN_REQUIRED,
    useWishlist,
} from "@/hooks/user/useWishlist";

export default function WishlistPage() {
    const router = useRouter();

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

    if (loading && wishlist.length === 0) {
        return (
            <div className="p-6">
                관심상품 불러오는 중...
            </div>
        );
    }

    if (error === WISHLIST_LOGIN_REQUIRED) {
        return (
            <div className="p-6">
                <p className="text-sm text-slate-600">관심상품은 로그인 후 이용할 수 있습니다.</p>
                <Link href="/auth" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    로그인
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen px-6 py-10">
            <div className="mx-auto w-full max-w-7xl space-y-4">
                {error && (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </p>
                )}

                <WishlistBox
                    items={wishlist}
                    onItemClick={(productPostId) =>
                        router.push(`/products/${productPostId}`)
                    }
                    onRemove={(productPostId) => {
                        removeWishlist(productPostId);
                    }}
                />
            </div>
        </main>
    );
}
