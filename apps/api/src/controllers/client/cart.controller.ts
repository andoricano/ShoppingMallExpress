// controllers/client/cart.controller.ts

import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface AddCartPayload {
    productId: string;
    quantity: number;
}

// ==========================================
// Supabase
// ==========================================

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

// ==========================================
// 1. Cart 조회
// ==========================================

export const getCart = async (
    req: Request,
    res: Response,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader?.startsWith(
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
            data: { user },
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
                .from("carts")
                .select(`
                    id,
                    client_id,
                    product_id,
                    quantity,
                    created_at,
                    updated_at,
                    product:products (
                        id,
                        name,
                        main_image_url,
                        image_urls,
                        description,
                        price,
                        inventory_id,
                        created_at,
                        updated_at
                    )
                `)
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
            "Get cart failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "장바구니를 불러오지 못했습니다.",
        });
    }
};

// ==========================================
// 2. Cart 추가 / 수량 변경
// ==========================================

export const addCart = async (
    req: Request<
        {},
        {},
        AddCartPayload
    >,
    res: Response,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader?.startsWith(
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
            data: { user },
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
            productId,
            quantity,
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message:
                    "상품 ID가 필요합니다.",
            });
        }

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "수량은 0보다 큰 정수여야 합니다.",
            });
        }

        const {
            data,
            error,
        } =
            await userSupabase
                .from("carts")
                .upsert(
                    {
                        client_id:
                            user.id,
                        product_id:
                            productId,
                        quantity,
                        updated_at:
                            new Date().toISOString(),
                    },
                    {
                        onConflict:
                            "client_id,product_id",
                    },
                )
                .select(`
                    id,
                    client_id,
                    product_id,
                    quantity,
                    created_at,
                    updated_at
                `)
                .single();

        if (error) {
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
            "Add cart failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "장바구니에 상품을 담지 못했습니다.",
        });
    }
};

// ==========================================
// 3. Cart 삭제
// ==========================================

export const removeCart = async (
    req: Request,
    res: Response,
) => {
    try {
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader?.startsWith(
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
            data: { user },
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
            productId,
        } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message:
                    "상품 ID가 필요합니다.",
            });
        }

        const {
            error,
        } =
            await userSupabase
                .from("carts")
                .delete()
                .eq(
                    "client_id",
                    user.id,
                )
                .eq(
                    "product_id",
                    productId,
                );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Remove cart failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "장바구니 상품 삭제에 실패했습니다.",
        });
    }
};