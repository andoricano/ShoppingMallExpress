// controllers/productPost.controller.ts

import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface ProductPostQuery {
    search?: string;
    isPublished?: string;
}

interface ProductPostProductPayload {
    productId: string;
    displayOrder?: number;
}

interface CreateProductPostPayload {
    title: string;
    thumbnail: Record<string, unknown>;
    imageUrls?: string[];
    content: string;
    tags?: string[];
    productIds?: ProductPostProductPayload[];
    isPublished?: boolean;
    metadata?: Record<string, unknown>;
}

interface UpdateProductPostPayload {
    title?: string;
    thumbnail?: Record<string, unknown>;
    imageUrls?: string[];
    content?: string;
    tags?: string[];
    productIds?: ProductPostProductPayload[];
    isPublished?: boolean;
    metadata?: Record<string, unknown>;
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
                    display_order
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
            content,
            tags = [],
            productIds = [],
            isPublished = false,
            metadata = {},
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "게시물 제목은 필수입니다.",
            });
        }

        const { data: post, error: postError } = await supabase
            .from("product_posts")
            .insert({
                title: title.trim(),
                thumbnail,
                image_urls: imageUrls,
                content,
                tags,
                is_published: isPublished,
                metadata,
                published_at: isPublished
                    ? new Date().toISOString()
                    : null,
            })
            .select("*")
            .single();

        if (postError) throw postError;

        // Product 연결
        if (productIds.length > 0) {
            const relations = productIds.map((item, index) => ({
                product_post_id: post.id,
                product_id: item.productId,
                display_order:
                    item.displayOrder ?? index,
            }));

            const { error: relationError } = await supabase
                .from("product_post_products")
                .insert(relations);

            if (relationError) throw relationError;
        }

        return res.status(201).json({
            success: true,
            data: toCamelCase({
                ...post,
                product_post_products: productIds.map(
                    (item, index) => ({
                        product_post_id: post.id,
                        product_id: item.productId,
                        display_order:
                            item.displayOrder ?? index,
                    })
                ),
            }),
        });
    } catch (error) {
        console.error(
            "Create product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 등록에 실패했습니다.",
            error: error instanceof Error
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
            imageUrls,
            content,
            tags,
            productIds,
            isPublished,
            metadata,
        } = req.body;

        const updateData: Record<string, unknown> = {};

        if (title !== undefined) {
            updateData.title = title.trim();
        }

        if (thumbnail !== undefined) {
            updateData.thumbnail = thumbnail;
        }

        if (imageUrls !== undefined) {
            updateData.image_urls = imageUrls;
        }

        if (content !== undefined) {
            updateData.content = content;
        }

        if (tags !== undefined) {
            updateData.tags = tags;
        }

        if (metadata !== undefined) {
            updateData.metadata = metadata;
        }

        if (isPublished !== undefined) {
            updateData.is_published = isPublished;

            if (isPublished) {
                updateData.published_at =
                    new Date().toISOString();
            } else {
                updateData.published_at = null;
            }
        }

        updateData.updated_at = new Date().toISOString();

        const { data: post, error: postError } = await supabase
            .from("product_posts")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (postError) throw postError;

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "상품 게시물을 찾을 수 없습니다.",
            });
        }

        // Product 연결 정보가 전달된 경우 전체 재구성
        if (productIds !== undefined) {
            const { error: deleteError } = await supabase
                .from("product_post_products")
                .delete()
                .eq("product_post_id", id);

            if (deleteError) throw deleteError;

            if (productIds.length > 0) {
                const relations = productIds.map(
                    (item, index) => ({
                        product_post_id: id,
                        product_id: item.productId,
                        display_order:
                            item.displayOrder ?? index,
                    })
                );

                const { error: insertError } = await supabase
                    .from("product_post_products")
                    .insert(relations);

                if (insertError) throw insertError;
            }
        }

        return res.json({
            success: true,
            data: toCamelCase(post),
        });
    } catch (error) {
        console.error(
            "Update product post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물 수정에 실패했습니다.",
            error: error instanceof Error
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


// ==========================================
// 7. Product 추가
// ==========================================

export const addProductToPost = async (
    req: Request<
        { id: string },
        {},
        ProductPostProductPayload
    >,
    res: Response
) => {
    try {
        const { id } = req.params;
        const {
            productId,
            displayOrder = 0,
        } = req.body;

        const { data, error } = await supabase
            .from("product_post_products")
            .insert({
                product_post_id: id,
                product_id: productId,
                display_order: displayOrder,
            })
            .select("*")
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Add product to post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물에 상품을 추가하지 못했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 8. Product 제거
// ==========================================

export const removeProductFromPost = async (
    req: Request<{
        id: string;
        productId: string;
    }>,
    res: Response
) => {
    try {
        const { id, productId } = req.params;

        const { error } = await supabase
            .from("product_post_products")
            .delete()
            .eq("product_post_id", id)
            .eq("product_id", productId);

        if (error) throw error;

        return res.json({
            success: true,
            message: "상품이 게시물에서 제거되었습니다.",
        });
    } catch (error) {
        console.error(
            "Remove product from post failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "상품 게시물에서 상품을 제거하지 못했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};