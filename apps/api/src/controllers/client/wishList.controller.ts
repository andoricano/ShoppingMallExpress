// controllers/client/wishlist.controller.ts

import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface AddWishlistPayload {
    productPostId: string;
}

// ==========================================
// 1. Client Wishlist 조회
// ==========================================

export const getWishlist = async (
    req: Request,
    res: Response,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer ",
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const accessToken =
            authHeader.substring(7);

        const userSupabase =
            createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_SECRET_KEY!,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                        },
                    },
                },
            );

        const {
            data: {
                user,
            },
            error: userError,
        } =
            await userSupabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const {
            data,
            error,
        } =
            await userSupabase
                .from("wishlists")
                .select(
                    `
                        id,
                        client_id,
                        product_post_id,
                        created_at,
                        product_post:product_posts (
                            id,
                            title,
                            thumbnail
                        )
                    `,
                )
                .eq(
                    "client_id",
                    user.id,
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    },
                );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: toCamelCase(
                data ?? [],
            ),
        });
    } catch (error) {
        console.error(
            "Get wishlist failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "관심상품을 불러오지 못했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. Client Wishlist 추가
// ==========================================

export const addWishlist = async (
    req: Request<
        {},
        {},
        AddWishlistPayload
    >,
    res: Response,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer ",
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const accessToken =
            authHeader.substring(7);

        const userSupabase =
            createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_SECRET_KEY!,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                        },
                    },
                },
            );

        const {
            data: {
                user,
            },
            error: userError,
        } =
            await userSupabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const {
            productPostId,
        } = req.body;

        if (!productPostId) {
            return res.status(400).json({
                success: false,
                message:
                    "상품 게시물 ID가 필요합니다.",
            });
        }

        const {
            data: productPost,
            error: productPostError,
        } =
            await userSupabase
                .from("product_posts")
                .select("id")
                .eq(
                    "id",
                    productPostId,
                )
                .maybeSingle();

        if (productPostError) {
            throw productPostError;
        }

        if (!productPost) {
            return res.status(404).json({
                success: false,
                message:
                    "상품 게시물을 찾을 수 없습니다.",
            });
        }

        const {
            data,
            error,
        } =
            await userSupabase
                .from("wishlists")
                .insert({
                    client_id: user.id,
                    product_post_id:
                        productPostId,
                })
                .select(
                    `
                        id,
                        client_id,
                        product_post_id,
                        created_at,
                        product_post:product_posts (
                            id,
                            title,
                            thumbnail
                        )
                    `,
                )
                .single();

        if (error) {
            if (
                error.code ===
                "23505"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "이미 관심상품에 등록된 상품 게시물입니다.",
                });
            }

            throw error;
        }

        return res.status(201).json({
            success: true,
            data: toCamelCase(
                data,
            ),
        });
    } catch (error) {
        console.error(
            "Add wishlist failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "관심상품 등록에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// 3. Client Wishlist 삭제
// ==========================================

export const removeWishlist = async (
    req: Request,
    res: Response,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer ",
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const accessToken =
            authHeader.substring(7);

        const userSupabase =
            createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_SECRET_KEY!,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                        },
                    },
                },
            );

        const {
            data: {
                user,
            },
            error: userError,
        } =
            await userSupabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const {
            productPostId,
        } = req.params;

        if (!productPostId) {
            return res.status(400).json({
                success: false,
                message:
                    "상품 게시물 ID가 필요합니다.",
            });
        }

        const {
            error,
        } =
            await userSupabase
                .from("wishlists")
                .delete()
                .eq(
                    "client_id",
                    user.id,
                )
                .eq(
                    "product_post_id",
                    productPostId,
                );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Remove wishlist failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "관심상품 삭제에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};