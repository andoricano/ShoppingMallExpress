// controllers/client/productPost.controller.ts

import type { Request, Response } from "express";
import { supabase } from "../../config/supabase.js";
import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// 1. Client 상품 게시물 목록 조회
// ==========================================

export const getDisplayProductPosts = async (
    _req: Request,
    res: Response
) => {
    try {
        const { data, error } = await supabase
            .from("product_posts")
            .select(`
                *,
                product_post_products (
                    id,
                    product_id,
                    display_order,
                    products (
                        id,
                        name,
                        main_image_url,
                        image_urls,
                        description,
                        price,
                        inventory_id,
                        inventory_items (
                            id,
                            sku_code,
                            current_stock,
                            is_active,
                            meta
                        )
                    )
                )
            `)
            .eq("is_published", true)
            .order("published_at", {
                ascending: false,
            });

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Get client product posts failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 목록 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};


// ==========================================
// 2. Client 상품 게시물 상세 조회
// ==========================================

export const getDisplayProductPostById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("product_posts")
            .select(`
                *,
                product_post_products (
                    id,
                    product_id,
                    display_order,
                    products (
                        id,
                        name,
                        main_image_url,
                        image_urls,
                        description,
                        price,
                        inventory_id,
                        inventory_items (
                            id,
                            sku_code,
                            current_stock,
                            is_active,
                            meta
                        )
                    )
                )
            `)
            .eq("id", id)
            .eq("is_published", true)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "상품 게시물을 찾을 수 없습니다.",
            });
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Get client product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};