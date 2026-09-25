"use client";

import {
    useEffect,
    useState,
} from "react";
import { useParams } from "next/navigation";

import { useProductPost } from "@/hooks/useProductPost";
import { useWishlist } from "@/hooks/user/useWishlist";
import { useCart } from "@/hooks/user/useCart";

import { ProductPostSection } from "@/components/product/post/ProductPostSection";
import type { ProductVariantSelection } from "@/components/product/purchase/ProductPurchase";

export default function ProductDetailPage() {
    const params =
        useParams<{ id: string }>();

    const productPostId =
        params.id;

    const {
        post,
        products,
        loading,
        error,
        fetchPost,
    } = useProductPost();

    const {
        wishlist,
        addWishlist,
        removeWishlist,
    } = useWishlist();

    const {
        addCart,
    } = useCart();

    const [
        selection,
        setSelection,
    ] = useState<ProductVariantSelection | null>(
        null,
    );

    const [
        showPurchaseButton,
        setShowPurchaseButton,
    ] = useState(false);

    useEffect(() => {
        if (productPostId) {
            fetchPost(productPostId);
        }
    }, [
        productPostId,
        fetchPost,
    ]);

    useEffect(() => {
        const handleScroll = () => {
            setShowPurchaseButton(
                window.scrollY > 500,
            );
        };

        window.addEventListener(
            "scroll",
            handleScroll,
        );

        handleScroll();

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll,
            );
        };
    }, []);

    const handleWishlistClick =
        async () => {
            if (!productPostId) {
                return;
            }

            const isWishlisted =
                wishlist.some(
                    (item) =>
                        item.productPostId ===
                        productPostId,
                );

            if (isWishlisted) {
                await removeWishlist(
                    productPostId,
                );

                return;
            }

            await addWishlist(
                productPostId,
            );
        };

    const handleCartClick =
        async () => {
            if (!selection?.isAvailable) {
                return;
            }

            // Cart is migrated separately; the legacy cart hook still takes
            // productId only (see PHASES.md Phase 6 Consumer blockers).
            await addCart(
                selection.productId,
                selection.quantity,
            );
        };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50/50">
                <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 2xl:max-w-6xl">
                    <p className="text-sm text-slate-500">
                        상품 게시물을 불러오는 중입니다.
                    </p>
                </div>
            </main>
        );
    }

    if (error || !post) {
        return (
            <main className="min-h-screen bg-slate-50/50">
                <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 2xl:max-w-6xl">
                    <p className="text-sm text-slate-500">
                        {error ??
                            "상품 게시물을 찾을 수 없습니다."}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="relative">
            <ProductPostSection
                post={post}
                products={products}
                reviews={[]}
                isWishlisted={wishlist.some(
                    (item) =>
                        item.productPostId ===
                        post.id,
                )}
                onWishlistClick={
                    handleWishlistClick
                }
                onCartClick={
                    handleCartClick
                }
                onSelectionChange={
                    setSelection
                }
            />
        </main>
    );
}