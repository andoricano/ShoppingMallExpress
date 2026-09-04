// controllers/productPost.controller.ts

import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";
import type { ProductPost } from "@mall/types";

// ==========================================
// Types
// ==========================================

interface ProductPostQuery {
    search?: string;
    isPublished?: string;
}

interface ProductPostProductPayload {
    id?: string;

    name: string;
    mainImageUrl: string;
    imageUrls?: string[];
    description?: string;
    price: number;
    inventoryId: string;
    displayOrder?: number;
}

interface UpdateProductPostPayload {
    title: string;
    thumbnail: ProductPost["thumbnail"];
    imageUrls?: string[];
    content?: string;
    isPublished?: boolean;
    metadata?: Record<string, unknown>;
    products?: ProductPostProductPayload[];
}


interface CreateProductPostPayload {
    title: string;

    thumbnail: ProductPost["thumbnail"];

    imageUrls?: string[];
    content?: string;

    isPublished?: boolean;

    metadata?: Record<string, unknown>;

    products: Array<{
        name: string;
        mainImageUrl: string;
        imageUrls?: string[];
        description?: string;
        price: number;
        inventoryId: string;
        displayOrder?: number;
    }>;
}

interface UpdateProductPostPayload {
    title: string;
    thumbnail: ProductPost["thumbnail"];
    imageUrls?: string[];
    content?: string;
    isPublished?: boolean;
    metadata?: Record<string, unknown>;
    products?: ProductPostProductPayload[];
}

// ==========================================
// 1. Admin 상품 게시물 목록 조회
// ==========================================

export const getAdminProductPosts = async (
    req: Request<{}, {}, {}, ProductPostQuery>,
    res: Response
) => {
    try {
        const { search, isPublished } = req.query;

        let query = supabase
            .from("product_posts")
            .select(`
                *,
                product_post_products (
                    id,
                    product_id,
                    display_order
                )
            `)
            .order("created_at", {
                ascending: false,
            });

        // 게시물 제목 검색
        if (search?.trim()) {
            query = query.ilike(
                "title",
                `%${search.trim()}%`
            );
        }

        // 공개 / 비공개 필터
        if (isPublished === "true") {
            query = query.eq("is_published", true);
        } else if (isPublished === "false") {
            query = query.eq("is_published", false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Get admin product posts failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 목록 조회에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 2. Admin 상품 게시물 상세 조회
// ==========================================

export const getProductPostById = async (
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
                    meta,
                    created_at,
                    updated_at
                )
            )
        )
    `)
            .eq("id", id)
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
            "Get product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 조회에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};
// ==========================================
// 3. Admin 상품 게시물 등록
// ==========================================

export const createProductPost = async (
    req: Request<{}, {}, CreateProductPostPayload>,
    res: Response
) => {
    try {
        const {
            title,
            thumbnail,
            imageUrls = [],
            content = "",
            isPublished = false,
            metadata = {},
            products = [],
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "게시물 제목은 필수입니다.",
            });
        }

        const { data, error } = await supabase.rpc(
            "create_product_post",
            {
                p_title: title.trim(),
                p_thumbnail: thumbnail,
                p_image_urls: imageUrls,
                p_content: content,
                p_is_published: isPublished,
                p_metadata: metadata,
                p_products: products,
            }
        );

        if (error) throw error;

        return res.status(201).json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Create product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 등록에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};


// ==========================================
// 4. Admin 상품 게시물 수정
// ==========================================

export const updateProductPost = async (
    req: Request<
        { id: string },
        {},
        UpdateProductPostPayload
    >,
    res: Response
) => {
    try {
        const { id } = req.params;

        const {
            title,
            thumbnail,
            imageUrls = [],
            content = "",
            isPublished = false,
            metadata = {},
            products = [],
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "게시물 제목은 필수입니다.",
            });
        }

        const { data, error } = await supabase.rpc(
            "update_product_post",
            {
                p_post_id: id,
                p_title: title.trim(),
                p_thumbnail: thumbnail,
                p_image_urls: imageUrls,
                p_content: content,
                p_is_published: isPublished,
                p_metadata: metadata,
                p_products: products,
            }
        );

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Update product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 수정에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};


// ==========================================
// 5. Admin 상품 게시물 상태 변경
// ==========================================

export const toggleProductPostStatus = async (
    req: Request<
        { id: string },
        {},
        { isPublished: boolean }
    >,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;

        const { data, error } = await supabase
            .from("product_posts")
            .update({
                is_published: isPublished,
                published_at: isPublished
                    ? new Date().toISOString()
                    : null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select("*")
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
            "Toggle product post status failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 상태 변경에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 6. Admin 상품 게시물 삭제
// ==========================================

export const deleteProductPost = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("product_posts")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return res.json({
            success: true,
            message: "상품 게시물이 삭제되었습니다.",
        });
    } catch (error) {
        console.error(
            "Delete product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 삭제에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};