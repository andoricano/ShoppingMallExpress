// hooks/user/useWishlist.ts

"use client";

import {
    useCallback,
    useState,
} from "react";

import type { ProductPostSummary } from "@mall/types";

import { createClient } from "@/lib/supabase/client";
import {
    useWishlistStore,
    type WishlistItemView,
} from "@/store/wishlistStore";

type WishlistRow = {
    id: string;
    client_id: string;
    product_post_id: string;
    created_at: string;
    product_posts: {
        id: string;
        title: string;
        slug: string | null;
        summary: string | null;
        thumbnail_url: string | null;
        published_at: string | null;
    } | null;
};

function toWishlistItem(row: WishlistRow): WishlistItemView {
    const post = row.product_posts;
    const productPost: ProductPostSummary | null = post
        ? {
            id: post.id,
            title: post.title,
            slug: post.slug,
            summary: post.summary,
            thumbnailUrl: post.thumbnail_url,
            publishedAt: post.published_at,
        }
        : null;

    return {
        id: row.id,
        clientId: row.client_id,
        productPostId: row.product_post_id,
        createdAt: row.created_at,
        productPost,
    };
}

export const WISHLIST_LOGIN_REQUIRED = "로그인이 필요합니다.";

/**
 * ProductPost-based Wishlist through direct Supabase + RLS on
 * `wishlist_items` (owner select/insert/delete; insert only for published
 * posts). The embedded ProductPost summary is read through the public
 * `product_posts` RLS, so unpublished posts come back as null.
 */
export function useWishlist() {
    const wishlist =
        useWishlistStore(
            (state) => state.items,
        );

    const setItems =
        useWishlistStore(
            (state) => state.setItems,
        );

    const removeItem =
        useWishlistStore(
            (state) => state.removeItem,
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const getSessionUserId = useCallback(async () => {
        const {
            data: { session },
        } = await createClient().auth.getSession();

        return session?.user.id ?? null;
    }, []);

    // ==========================================
    // 1. Wishlist 조회
    // ==========================================
    const fetchWishlist = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!(await getSessionUserId())) {
                setItems([]);
                setError(WISHLIST_LOGIN_REQUIRED);

                return [];
            }

            const { data, error: selectError } = await createClient()
                .from("wishlist_items")
                .select("id, client_id, product_post_id, created_at, product_posts(id, title, slug, summary, thumbnail_url, published_at)")
                .order("created_at", { ascending: false });

            if (selectError) {
                throw selectError;
            }

            const items = (data as unknown as WishlistRow[]).map(toWishlistItem);

            setItems(items);

            return items;
        } catch {
            setError("관심상품을 불러오지 못했습니다.");

            return [];
        } finally {
            setLoading(false);
        }
    }, [getSessionUserId, setItems]);

    // ==========================================
    // 2. Wishlist 추가
    // ==========================================
    const addWishlist = useCallback(
        async (productPostId: string) => {
            setError(null);

            const clientId = await getSessionUserId();

            if (!clientId) {
                setError(WISHLIST_LOGIN_REQUIRED);

                return false;
            }

            const { error: insertError } = await createClient()
                .from("wishlist_items")
                .insert({
                    client_id: clientId,
                    product_post_id: productPostId,
                });

            // 23505: already in the wishlist (client_id, product_post_id).
            if (insertError && insertError.code !== "23505") {
                setError(
                    insertError.code === "42501"
                        ? "판매 중인 게시물만 관심상품에 담을 수 있습니다."
                        : "관심상품에 담지 못했습니다.",
                );

                return false;
            }

            await fetchWishlist();

            return true;
        },
        [fetchWishlist, getSessionUserId],
    );

    // ==========================================
    // 3. Wishlist 삭제
    // ==========================================
    const removeWishlist = useCallback(
        async (productPostId: string) => {
            setError(null);

            if (!(await getSessionUserId())) {
                setError(WISHLIST_LOGIN_REQUIRED);

                return false;
            }

            const { error: deleteError } = await createClient()
                .from("wishlist_items")
                .delete()
                .eq("product_post_id", productPostId);

            if (deleteError) {
                setError("관심상품을 삭제하지 못했습니다.");

                return false;
            }

            removeItem(productPostId);

            return true;
        },
        [getSessionUserId, removeItem],
    );

    return {
        wishlist,

        loading,
        error,

        fetchWishlist,
        addWishlist,
        removeWishlist,
    };
}
