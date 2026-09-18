import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Supabase
// ==========================================

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
);

// ==========================================
// 1. Client Category 조회
// ==========================================

export const getClientProductPostCategories =
    async (
        _req: Request,
        res: Response,
    ) => {
        try {
            const {
                data,
                error,
            } = await supabase
                .from(
                    "product_post_category",
                )
                .select("*")
                .eq(
                    "is_active",
                    true,
                )
                .order("depth", {
                    ascending: true,
                })
                .order(
                    "display_order",
                    {
                        ascending: true,
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
                "Get client product post categories failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리 조회에 실패했습니다.",
                error:
                    error instanceof Error
                        ? error.message
                        : JSON.stringify(
                            error,
                        ),
            });
        }
    };

// ==========================================
// 2. Client Category Product Post 조회
// id + thumbnail
// ==========================================

export const getClientProductPostsByCategory =
    async (
        req: Request<{
            categoryId: string;
        }>,
        res: Response,
    ) => {
        try {
            const {
                categoryId,
            } = req.params;

            if (!categoryId?.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "categoryId는 필수입니다.",
                });
            }

            const normalizedCategoryId =
                categoryId.trim();

            // ==========================================
            // Category 존재 + 활성 상태 확인
            // ==========================================

            const {
                data: category,
                error: categoryError,
            } = await supabase
                .from(
                    "product_post_category",
                )
                .select("id")
                .eq(
                    "id",
                    normalizedCategoryId,
                )
                .eq(
                    "is_active",
                    true,
                )
                .maybeSingle();

            if (categoryError) {
                throw categoryError;
            }

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message:
                        "카테고리를 찾을 수 없습니다.",
                });
            }

            // ==========================================
            // Category ↔ ProductPost 관계 조회
            // ==========================================

            const {
                data: relations,
                error: relationsError,
            } = await supabase
                .from(
                    "product_post_categories",
                )
                .select(
                    "product_post_id",
                )
                .eq(
                    "category_id",
                    normalizedCategoryId,
                );

            if (relationsError) {
                throw relationsError;
            }

            const postIds =
                (relations ?? []).map(
                    (relation) =>
                        relation.product_post_id,
                );

            if (postIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                });
            }

            // ==========================================
            // ProductPost 조회
            // ==========================================

            const {
                data: posts,
                error: postsError,
            } = await supabase
                .from("product_posts")
                .select(
                    "id, thumbnail",
                )
                .in(
                    "id",
                    postIds,
                );

            if (postsError) {
                throw postsError;
            }

            // ==========================================
            // Category Item 반환
            // ==========================================

            const result =
                (posts ?? []).map(
                    (post) => ({
                        id: post.id,
                        thumbnail:
                            post.thumbnail,
                    }),
                );

            return res.json({
                success: true,
                data: toCamelCase(
                    result,
                ),
            });
        } catch (error) {
            console.error(
                "Get client product posts by category failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리 게시물 조회에 실패했습니다.",
                error:
                    error instanceof Error
                        ? error.message
                        : JSON.stringify(
                            error,
                        ),
            });
        }
    };