// controllers/admin/productPostCategory.controller.ts

import type {
    Request,
    Response,
} from "express";

import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

/**
 * Category 생성 요청
 */
interface CreateProductPostCategoryPayload {
    parentId?: string | null;
    name: string;
    slug: string;
    depth?: number;
    displayOrder?: number;
    isActive?: boolean;
}

/**
 * Category 수정 요청
 */
interface UpdateProductPostCategoryPayload {
    parentId?: string | null;
    name?: string;
    slug?: string;
    depth?: number;
    displayOrder?: number;
    isActive?: boolean;
}

// ==========================================
// 1. Category 조회
// ==========================================

export const getProductPostCategories = async (
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
            .order(
                "depth",
                {
                    ascending: true,
                },
            )
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
            "Get product post categories failed:",
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
// 2. Category 생성
// ==========================================

export const createProductPostCategory =
    async (
        req: Request<
            {},
            {},
            CreateProductPostCategoryPayload
        >,
        res: Response,
    ) => {
        try {
            const {
                parentId = null,
                name,
                slug,
                depth = 1,
                displayOrder = 0,
                isActive = true,
            } = req.body;

            if (!name?.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "name은 필수입니다.",
                });
            }

            if (!slug?.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "slug는 필수입니다.",
                });
            }

            if (
                !Number.isInteger(
                    depth,
                ) ||
                depth < 1 ||
                depth > 3
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "depth는 1~3 사이의 정수여야 합니다.",
                });
            }

            if (
                !Number.isInteger(
                    displayOrder,
                ) ||
                displayOrder < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "displayOrder는 0 이상의 정수여야 합니다.",
                });
            }

            if (parentId) {
                const {
                    data: parent,
                    error: parentError,
                } =
                    await supabase
                        .from(
                            "product_post_category",
                        )
                        .select(
                            "id, depth",
                        )
                        .eq(
                            "id",
                            parentId,
                        )
                        .single();

                if (parentError) {
                    throw parentError;
                }

                if (!parent) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "상위 카테고리를 찾을 수 없습니다.",
                    });
                }

                if (
                    parent.depth >= 3
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "3단계를 초과하는 카테고리는 생성할 수 없습니다.",
                    });
                }

                if (
                    depth !==
                    parent.depth + 1
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "parentId와 depth가 일치하지 않습니다.",
                    });
                }
            } else if (depth !== 1) {
                return res.status(400).json({
                    success: false,
                    message:
                        "최상위 카테고리의 depth는 1이어야 합니다.",
                });
            }

            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        "product_post_category",
                    )
                    .insert({
                        parent_id:
                            parentId,
                        name: name.trim(),
                        slug: slug.trim(),
                        depth,
                        display_order:
                            displayOrder,
                        is_active:
                            isActive,
                    })
                    .select()
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
                "Create product post category failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리 생성에 실패했습니다.",
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
// 3. Category 수정
// ==========================================

export const updateProductPostCategory =
    async (
        req: Request<
            { id: string },
            {},
            UpdateProductPostCategoryPayload
        >,
        res: Response,
    ) => {
        try {
            const { id } =
                req.params;

            const {
                parentId,
                name,
                slug,
                depth,
                displayOrder,
                isActive,
            } = req.body;

            const updateData: Record<
                string,
                unknown
            > = {};

            if (
                name !== undefined
            ) {
                if (!name.trim()) {
                    return res.status(
                        400,
                    ).json({
                        success: false,
                        message:
                            "name은 비어 있을 수 없습니다.",
                    });
                }

                updateData.name =
                    name.trim();
            }

            if (
                slug !== undefined
            ) {
                if (!slug.trim()) {
                    return res.status(
                        400,
                    ).json({
                        success: false,
                        message:
                            "slug는 비어 있을 수 없습니다.",
                    });
                }

                updateData.slug =
                    slug.trim();
            }

            if (
                depth !== undefined
            ) {
                if (
                    !Number.isInteger(
                        depth,
                    ) ||
                    depth < 1 ||
                    depth > 3
                ) {
                    return res.status(
                        400,
                    ).json({
                        success: false,
                        message:
                            "depth는 1~3 사이의 정수여야 합니다.",
                    });
                }

                updateData.depth =
                    depth;
            }

            if (
                displayOrder !==
                undefined
            ) {
                if (
                    !Number.isInteger(
                        displayOrder,
                    ) ||
                    displayOrder < 0
                ) {
                    return res.status(
                        400,
                    ).json({
                        success: false,
                        message:
                            "displayOrder는 0 이상의 정수여야 합니다.",
                    });
                }

                updateData.display_order =
                    displayOrder;
            }

            if (
                isActive !==
                undefined
            ) {
                updateData.is_active =
                    isActive;
            }

            if (
                parentId !== undefined
            ) {
                updateData.parent_id =
                    parentId;
            }

            if (
                depth !== undefined ||
                parentId !==
                    undefined
            ) {
                const {
                    data: current,
                    error: currentError,
                } =
                    await supabase
                        .from(
                            "product_post_category",
                        )
                        .select(
                            "id, parent_id, depth",
                        )
                        .eq(
                            "id",
                            id,
                        )
                        .single();

                if (currentError) {
                    throw currentError;
                }

                if (!current) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "카테고리를 찾을 수 없습니다.",
                    });
                }

                const nextParentId =
                    parentId !==
                    undefined
                        ? parentId
                        : current.parent_id;

                const nextDepth =
                    depth !==
                    undefined
                        ? depth
                        : current.depth;

                if (
                    nextParentId
                ) {
                    if (
                        nextParentId ===
                        id
                    ) {
                        return res.status(
                            400,
                        ).json({
                            success: false,
                            message:
                                "자기 자신을 상위 카테고리로 지정할 수 없습니다.",
                        });
                    }

                    const {
                        data: parent,
                        error: parentError,
                    } =
                        await supabase
                            .from(
                                "product_post_category",
                            )
                            .select(
                                "id, depth",
                            )
                            .eq(
                                "id",
                                nextParentId,
                            )
                            .single();

                    if (
                        parentError
                    ) {
                        throw parentError;
                    }

                    if (!parent) {
                        return res
                            .status(
                                400,
                            )
                            .json({
                                success: false,
                                message:
                                    "상위 카테고리를 찾을 수 없습니다.",
                            });
                    }

                    if (
                        parent.depth >=
                        3
                    ) {
                        return res
                            .status(
                                400,
                            )
                            .json({
                                success: false,
                                message:
                                    "3단계를 초과하는 카테고리는 사용할 수 없습니다.",
                            });
                    }

                    if (
                        nextDepth !==
                        parent.depth +
                            1
                    ) {
                        return res
                            .status(
                                400,
                            )
                            .json({
                                success: false,
                                message:
                                    "parentId와 depth가 일치하지 않습니다.",
                            });
                    }
                } else if (
                    nextDepth !== 1
                ) {
                    return res
                        .status(
                            400,
                        )
                        .json({
                            success: false,
                            message:
                                "최상위 카테고리의 depth는 1이어야 합니다.",
                        });
                }
            }

            if (
                Object.keys(
                    updateData,
                ).length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "수정할 데이터가 없습니다.",
                });
            }

            updateData.updated_at =
                new Date().toISOString();

            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        "product_post_category",
                    )
                    .update(
                        updateData,
                    )
                    .eq(
                        "id",
                        id,
                    )
                    .select()
                    .single();

            if (error) {
                throw error;
            }

            return res.json({
                success: true,
                data: toCamelCase(
                    data,
                ),
            });
        } catch (error) {
            console.error(
                "Update product post category failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리 수정에 실패했습니다.",
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
// 4. Category 삭제
// ==========================================

export const deleteProductPostCategory =
    async (
        req: Request<{
            id: string;
        }>,
        res: Response,
    ) => {
        try {
            const { id } =
                req.params;

            const {
                data,
                error,
            } =
                await supabase
                    .from(
                        "product_post_category",
                    )
                    .delete()
                    .eq(
                        "id",
                        id,
                    )
                    .select()
                    .single();

            if (error) {
                throw error;
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message:
                        "카테고리를 찾을 수 없습니다.",
                });
            }

            return res.json({
                success: true,
                data: toCamelCase(
                    data,
                ),
            });
        } catch (error) {
            console.error(
                "Delete product post category failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리 삭제에 실패했습니다.",
                error:
                    error instanceof Error
                        ? error.message
                        : JSON.stringify(
                              error,
                          ),
            });
        }
    };