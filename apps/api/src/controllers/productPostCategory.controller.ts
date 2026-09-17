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


interface AddProductPostsToCategoryPayload {
    postIds: string[];
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
            const { id } = req.params;

            // ------------------------------------------
            // 1. 현재 Category 조회
            // ------------------------------------------

            const {
                data: current,
                error: currentError,
            } = await supabase
                .from(
                    "product_post_category",
                )
                .select(
                    "id, parent_id, depth",
                )
                .eq("id", id)
                .maybeSingle();

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

            // ------------------------------------------
            // 2. Request Body
            // ------------------------------------------

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

            // ------------------------------------------
            // 3. 일반 필드 검증
            // ------------------------------------------

            if (name !== undefined) {
                if (!name.trim()) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "name은 비어 있을 수 없습니다.",
                    });
                }

                updateData.name =
                    name.trim();
            }

            if (slug !== undefined) {
                if (!slug.trim()) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "slug는 비어 있을 수 없습니다.",
                    });
                }

                updateData.slug =
                    slug.trim();
            }

            if (depth !== undefined) {
                if (
                    !Number.isInteger(depth) ||
                    depth < 1 ||
                    depth > 3
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "depth는 1~3 사이의 정수여야 합니다.",
                    });
                }

                updateData.depth = depth;
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
                    return res.status(400).json({
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
                if (
                    typeof isActive !==
                    "boolean"
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "isActive는 boolean이어야 합니다.",
                    });
                }

                updateData.is_active =
                    isActive;
            }

            // ------------------------------------------
            // 4. 다음 parentId / depth 계산
            // ------------------------------------------

            const nextParentId =
                parentId !== undefined
                    ? parentId
                    : current.parent_id;

            const nextDepth =
                depth !== undefined
                    ? depth
                    : current.depth;

            // parentId가 요청에 포함된 경우
            if (
                parentId !== undefined
            ) {
                updateData.parent_id =
                    parentId;
            }

            // ------------------------------------------
            // 5. parentId / depth 관계 검증
            // ------------------------------------------

            if (
                parentId !== undefined ||
                depth !== undefined
            ) {
                // ------------------------------
                // 최상위 Category
                // ------------------------------

                if (nextParentId === null) {
                    if (nextDepth !== 1) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "최상위 카테고리의 depth는 1이어야 합니다.",
                        });
                    }
                }

                // ------------------------------
                // 하위 Category
                // ------------------------------

                else {
                    // 자기 자신 검사
                    if (
                        nextParentId === id
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "자기 자신을 상위 카테고리로 지정할 수 없습니다.",
                        });
                    }

                    // 부모 Category 조회
                    const {
                        data: parent,
                        error: parentError,
                    } = await supabase
                        .from(
                            "product_post_category",
                        )
                        .select(
                            "id, parent_id, depth",
                        )
                        .eq(
                            "id",
                            nextParentId,
                        )
                        .maybeSingle();

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

                    // 부모가 이미 3단계인 경우
                    if (parent.depth >= 3) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "3단계를 초과하는 카테고리는 사용할 수 없습니다.",
                        });
                    }

                    // parent.depth + 1 검증
                    if (
                        nextDepth !==
                        parent.depth + 1
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "parentId와 depth가 일치하지 않습니다.",
                        });
                    }

                    // --------------------------------------
                    // 순환 참조 검사
                    //
                    // 현재 Category의 하위 Category를
                    // 부모로 지정하면 안 됨
                    // --------------------------------------

                    let ancestorId:
                        | string
                        | null =
                        parent.id;

                    while (
                        ancestorId !== null
                    ) {
                        if (
                            ancestorId === id
                        ) {
                            return res
                                .status(400)
                                .json({
                                    success: false,
                                    message:
                                        "하위 카테고리를 상위 카테고리로 지정할 수 없습니다.",
                                });
                        }

                        const {
                            data: ancestor,
                            error: ancestorError,
                        } =
                            await supabase
                                .from(
                                    "product_post_category",
                                )
                                .select(
                                    "id, parent_id",
                                )
                                .eq(
                                    "id",
                                    ancestorId,
                                )
                                .maybeSingle();

                        if (
                            ancestorError
                        ) {
                            throw ancestorError;
                        }

                        if (!ancestor) {
                            break;
                        }

                        ancestorId =
                            ancestor.parent_id;
                    }
                }

                updateData.depth =
                    nextDepth;
            }

            // ------------------------------------------
            // 6. 수정할 데이터 확인
            // ------------------------------------------

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

            // ------------------------------------------
            // 7. updated_at
            // ------------------------------------------

            updateData.updated_at =
                new Date().toISOString();

            // ------------------------------------------
            // 8. DB Update
            // ------------------------------------------

            const {
                data,
                error,
            } = await supabase
                .from(
                    "product_post_category",
                )
                .update(updateData)
                .eq("id", id)
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
            const { id } = req.params;

            const {
                data,
                error,
            } = await supabase
                .from(
                    "product_post_category",
                )
                .delete()
                .eq("id", id)
                .select()
                .maybeSingle();

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
                data: toCamelCase(data),
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


// ==========================================
// 5. Category에 Product Post 등록
//
// 여러 Post를 한 Category에 일괄 등록
// 이미 등록된 관계는 무시
// ==========================================

export const addProductPostsToCategory =
    async (
        req: Request<
            { categoryId: string },
            {},
            AddProductPostsToCategoryPayload
        >,
        res: Response,
    ) => {
        try {
            const {
                categoryId,
            } = req.params;

            const {
                postIds,
            } = req.body;

            // ------------------------------------------
            // 1. 입력 검증
            // ------------------------------------------

            if (
                !Array.isArray(postIds) ||
                postIds.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "postIds는 하나 이상의 게시물 ID를 포함해야 합니다.",
                });
            }

            const uniquePostIds =
                [
                    ...new Set(postIds),
                ];

            // ------------------------------------------
            // 2. Category 존재 여부 확인
            // ------------------------------------------

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
                    categoryId,
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

            // ------------------------------------------
            // 3. Post 존재 여부 확인
            // ------------------------------------------

            const {
                data: posts,
                error: postsError,
            } = await supabase
                .from("product_posts")
                .select("id")
                .in(
                    "id",
                    uniquePostIds,
                );

            if (postsError) {
                throw postsError;
            }

            const existingPostIds = new Set(
                (posts ?? []).map(
                    (post) => post.id,
                ),
            );

            const invalidPostIds =
                uniquePostIds.filter(
                    (postId) =>
                        !existingPostIds.has(
                            postId,
                        ),
                );

            if (
                invalidPostIds.length > 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "존재하지 않는 게시물 ID가 포함되어 있습니다.",
                    data: invalidPostIds,
                });
            }

            // ------------------------------------------
            // 4. 관계 등록
            //
            // UNIQUE
            // (product_post_id, category_id)
            // 이미 존재하면 무시
            // ------------------------------------------

            const rows =
                uniquePostIds.map(
                    (postId) => ({
                        product_post_id:
                            postId,
                        category_id:
                            categoryId,
                    }),
                );

            const {
                data,
                error,
            } = await supabase
                .from(
                    "product_post_categories",
                )
                .upsert(
                    rows,
                    {
                        onConflict:
                            "product_post_id,category_id",
                        ignoreDuplicates:
                            true,
                    },
                )
                .select();

            if (error) {
                throw error;
            }

            return res.status(201).json({
                success: true,
                data: data ?? [],
            });
        } catch (error) {
            console.error(
                "Add product posts to category failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리에 게시물을 등록하는데 실패했습니다.",
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
// 6. Category의 Product Post Filtering
//
// Category에 등록된 Post의
// id + thumbnail만 반환
// ==========================================

export const getProductPostsByCategory =
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

            // ------------------------------------------
            // 1. Category 존재 여부 확인
            // ------------------------------------------

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
                    categoryId,
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

            // ------------------------------------------
            // 2. Category ↔ Post 관계 조회
            // ------------------------------------------

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
                    categoryId,
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

            // ------------------------------------------
            // 3. 실제 Post 조회
            // ------------------------------------------

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

            // ------------------------------------------
            // 4. Category Item 형태로 반환
            // ------------------------------------------

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
                data: result,
            });
        } catch (error) {
            console.error(
                "Get product posts by category failed:",
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


// ==========================================
// Category에서 Product Post 연결 해제
// ==========================================

export const removePostFromCategory =
    async (
        req: Request<{
            categoryId: string;
            postId: string;
        }>,
        res: Response,
    ) => {
        try {
            const {
                categoryId,
                postId,
            } = req.params;

            const {
                data,
                error,
            } = await supabase
                .from(
                    "product_post_categories",
                )
                .delete()
                .eq(
                    "category_id",
                    categoryId,
                )
                .eq(
                    "product_post_id",
                    postId,
                )
                .select()
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message:
                        "카테고리와 게시물의 연결을 찾을 수 없습니다.",
                });
            }

            return res.json({
                success: true,
                data,
            });
        } catch (error) {
            console.error(
                "Remove product post from category failed:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "카테고리에서 게시물 연결 해제에 실패했습니다.",
                error:
                    error instanceof Error
                        ? error.message
                        : JSON.stringify(error),
            });
        }
    };