"use client";

import {
    useEffect,
    useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useProductPost } from "@/hooks/useProductPost";
import { useWishlist } from "@/hooks/user/useWishlist";
import {
    LOGIN_REQUIRED_MESSAGE,
    useCart,
} from "@/hooks/user/useCart";

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
        error: cartError,
    } = useCart();

    const [
        cartMessage,
        setCartMessage,
    ] = useState<string | null>(null);

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
            if (!selection) {
                setCartMessage("옵션을 선택해 주세요.");
                return;
            }

            if (!selection.isAvailable) {
                setCartMessage("품절 또는 판매 중지된 옵션입니다.");
                return;
            }

            // Cart identity is Product + ProductVariant (add_cart_item).
            const added = await addCart({
                productId: selection.productId,
                productVariantId: selection.productVariantId,
                quantity: selection.quantity,
            });

            setCartMessage(
                added ? "장바구니에 담았습니다." : null,
            );
        };

    const cartNotice =
        cartMessage ?? cartError;

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

            {cartNotice && (
                <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
                    {cartNotice}
                    {cartNotice === LOGIN_REQUIRED_MESSAGE && (
                        <Link href="/auth" className="ml-2 underline">
                            로그인
                        </Link>
                    )}
                    {cartNotice === "장바구니에 담았습니다." && (
                        <Link href="/cart" className="ml-2 underline">
                            장바구니 보기
                        </Link>
                    )}
                </div>
            )}
        </main>
    );
}