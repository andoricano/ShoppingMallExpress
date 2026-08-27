// controllers/category.controller.ts

import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

// ==========================================
// Constants
// ==========================================

const CATEGORY_STATUS = {
    DISPLAY: 'DISPLAY',
    HIDDEN: 'HIDDEN',
} as const;

const MAX_DEPTH = 3;

// ==========================================
// Helpers
// ==========================================

const getErrorMessage = (error: unknown) => {
    return error instanceof Error
        ? error.message
        : JSON.stringify(error);
};

// 부모 카테고리를 기준으로 새 카테고리의 Depth 계산
const getDepthByParent = async (
    parentId: string | null,
) => {
    if (!parentId) {
        return 1;
    }

    const {
        data,
        error,
    } = await supabase
        .from('categories')
        .select('category_id, depth')
        .eq('category_id', parentId)
        .single();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    return Number(data.depth) + 1;
};

// 동일 부모 내 카테고리명 중복 확인
const existsSameCategoryName = async (
    categoryName: string,
    parentId: string | null,
    excludeId?: string,
) => {
    let query = supabase
        .from('categories')
        .select('category_id')
        .eq('category_name', categoryName);

    if (parentId === null) {
        query = query.is('parent_id', null);
    } else {
        query = query.eq('parent_id', parentId);
    }

    if (excludeId) {
        query = query.neq('category_id', excludeId);
    }

    const {
        data,
        error,
    } = await query.limit(1);

    if (error) {
        throw error;
    }

    return (data?.length ?? 0) > 0;
};

// ==========================================
// 1. 전체 카테고리 트리 조회
// GET /api/admin/categories/tree
// ==========================================

export const getCategoryTree = async (
    _req: Request,
    res: Response,
) => {
    try {
        const {
            data,
            error,
        } = await supabase
            .from('categories')
            .select('*')
            .order('depth', {
                ascending: true,
            })
            .order('sort_order', {
                ascending: true,
            });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(
            'getCategoryTree failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '카테고리 트리 조회에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 2. 카테고리 신규 생성
// POST /api/admin/categories
// ==========================================

export const createCategory = async (
    req: Request,
    res: Response,
) => {
    try {
        const {
            categoryName,
            parentId = null,
            status = CATEGORY_STATUS.DISPLAY,
            sortOrder = 0,
        } = req.body;

        // ------------------------------
        // Validation
        // ------------------------------

        if (
            typeof categoryName !== 'string' ||
            categoryName.trim().length < 1 ||
            categoryName.trim().length > 50
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '카테고리명을 입력해주세요. (최대 50자)',
            });
        }

        if (
            status !== CATEGORY_STATUS.DISPLAY &&
            status !== CATEGORY_STATUS.HIDDEN
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 카테고리 상태입니다.',
            });
        }

        const depth =
            await getDepthByParent(parentId);

        if (depth === null) {
            return res.status(404).json({
                success: false,
                message:
                    '상위 카테고리를 찾을 수 없습니다.',
            });
        }

        if (depth > MAX_DEPTH) {
            return res.status(400).json({
                success: false,
                message:
                    '카테고리는 최대 3단계까지만 생성할 수 있습니다.',
            });
        }

        const duplicated =
            await existsSameCategoryName(
                categoryName.trim(),
                parentId,
            );

        if (duplicated) {
            return res.status(409).json({
                success: false,
                message:
                    '동일 계층 내에 이미 존재하는 카테고리명입니다.',
            });
        }

        // ------------------------------
        // Insert
        // ------------------------------

        const {
            data,
            error,
        } = await supabase
            .from('categories')
            .insert({
                category_name:
                    categoryName.trim(),
                parent_id: parentId,
                depth,
                status,
                sort_order: sortOrder,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(201).json({
            success: true,
            data,
            message:
                '카테고리가 생성되었습니다.',
        });
    } catch (error) {
        console.error(
            'createCategory failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '카테고리 생성에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 3. 카테고리 정보 수정
// PUT /api/admin/categories/:id
// ==========================================

export const updateCategory = async (
    req: Request<{ id: string }>,
    res: Response,
) => {
    try {
        const { id } = req.params;

        const {
            categoryName,
            parentId,
            status,
            sortOrder,
        } = req.body;

        // ------------------------------
        // 기존 카테고리 조회
        // ------------------------------

        const {
            data: currentCategory,
            error: currentError,
        } = await supabase
            .from('categories')
            .select('*')
            .eq('category_id', id)
            .single();

        if (currentError) {
            if (
                currentError.code ===
                'PGRST116'
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        '카테고리를 찾을 수 없습니다.',
                });
            }

            throw currentError;
        }

        // ------------------------------
        // Validation
        // ------------------------------

        const nextName =
            categoryName !== undefined
                ? categoryName.trim()
                : currentCategory.category_name;

        const nextParentId =
            parentId !== undefined
                ? parentId
                : currentCategory.parent_id;

        if (
            !nextName ||
            nextName.length > 50
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '카테고리명을 입력해주세요. (최대 50자)',
            });
        }

        if (
            status !== undefined &&
            status !== CATEGORY_STATUS.DISPLAY &&
            status !== CATEGORY_STATUS.HIDDEN
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 카테고리 상태입니다.',
            });
        }

        if (nextParentId === id) {
            return res.status(400).json({
                success: false,
                message:
                    '자기 자신을 상위 카테고리로 지정할 수 없습니다.',
            });
        }

        // 부모가 변경되었거나 기존 구조를 검증
        const nextDepth =
            nextParentId !==
                currentCategory.parent_id
                ? await getDepthByParent(
                    nextParentId,
                )
                : currentCategory.depth;

        if (nextDepth === null) {
            return res.status(404).json({
                success: false,
                message:
                    '상위 카테고리를 찾을 수 없습니다.',
            });
        }

        if (nextDepth > MAX_DEPTH) {
            return res.status(400).json({
                success: false,
                message:
                    '카테고리는 최대 3단계까지만 이동할 수 있습니다.',
            });
        }

        if (
            categoryName !== undefined ||
            parentId !== undefined
        ) {
            const duplicated =
                await existsSameCategoryName(
                    nextName,
                    nextParentId,
                    id,
                );

            if (duplicated) {
                return res.status(409).json({
                    success: false,
                    message:
                        '동일 계층 내에 이미 존재하는 카테고리명입니다.',
                });
            }
        }

        // ------------------------------
        // Update
        // ------------------------------

        const updateData: Record<
            string,
            unknown
        > = {};

        if (
            categoryName !== undefined
        ) {
            updateData.category_name =
                nextName;
        }

        if (
            parentId !== undefined
        ) {
            updateData.parent_id =
                nextParentId;
            updateData.depth =
                nextDepth;
        }

        if (
            status !== undefined
        ) {
            updateData.status = status;
        }

        if (
            sortOrder !== undefined
        ) {
            updateData.sort_order =
                sortOrder;
        }

        const {
            data,
            error,
        } = await supabase
            .from('categories')
            .update(updateData)
            .eq('category_id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data,
            message:
                '카테고리 정보가 수정되었습니다.',
        });
    } catch (error) {
        console.error(
            'updateCategory failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '카테고리 수정에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 4. 카테고리 순서 / 계층 일괄 변경
// PATCH /api/admin/categories/reorder
// ==========================================

export const reorderCategories = async (
    req: Request,
    res: Response,
) => {
    try {
        const { items } = req.body;

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '변경할 카테고리가 없습니다.',
            });
        }

        // ------------------------------
        // 사전 검증
        // ------------------------------

        for (const item of items) {
            if (
                !item.id ||
                !Number.isInteger(
                    item.sortOrder,
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        '카테고리 순서 정보가 올바르지 않습니다.',
                });
            }

            if (
                item.parentId === item.id
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        '자기 자신을 상위 카테고리로 지정할 수 없습니다.',
                });
            }

            const depth =
                await getDepthByParent(
                    item.parentId ?? null,
                );

            if (depth === null) {
                return res.status(404).json({
                    success: false,
                    message:
                        '상위 카테고리를 찾을 수 없습니다.',
                });
            }

            if (depth > MAX_DEPTH) {
                return res.status(400).json({
                    success: false,
                    message:
                        '카테고리는 최대 3단계까지만 이동할 수 있습니다.',
                });
            }
        }

        // ------------------------------
        // Update
        // ------------------------------

        // 현재는 순차 업데이트.
        // 이후 필요하면 Supabase RPC로
        // 하나의 Transaction으로 묶습니다.

        for (const item of items) {
            const depth =
                await getDepthByParent(
                    item.parentId ?? null,
                );

            const {
                error,
            } = await supabase
                .from('categories')
                .update({
                    parent_id:
                        item.parentId ?? null,
                    depth,
                    sort_order:
                        item.sortOrder,
                })
                .eq(
                    'category_id',
                    item.id,
                );

            if (error) {
                throw error;
            }
        }

        res.json({
            success: true,
            message:
                '카테고리 순서 및 계층이 변경되었습니다.',
        });
    } catch (error) {
        console.error(
            'reorderCategories failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '카테고리 순서 변경에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 5. 카테고리 삭제
// DELETE /api/admin/categories/:id
// ==========================================

export const deleteCategory = async (
    req: Request<{ id: string }>,
    res: Response,
) => {
    try {
        const { id } = req.params;

        // ------------------------------
        // 카테고리 존재 여부
        // ------------------------------

        const {
            data: category,
            error: categoryError,
        } = await supabase
            .from('categories')
            .select('category_id')
            .eq('category_id', id)
            .single();

        if (categoryError) {
            if (
                categoryError.code ===
                'PGRST116'
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        '카테고리를 찾을 수 없습니다.',
                });
            }

            throw categoryError;
        }

        if (!category) {
            return res.status(404).json({
                success: false,
                message:
                    '카테고리를 찾을 수 없습니다.',
            });
        }

        // ------------------------------
        // 하위 카테고리 확인
        // ------------------------------

        const {
            count: childCount,
            error: childError,
        } = await supabase
            .from('categories')
            .select(
                'category_id',
                {
                    count: 'exact',
                    head: true,
                },
            )
            .eq('parent_id', id);

        if (childError) {
            throw childError;
        }

        if (
            (childCount ?? 0) > 0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    '하위 카테고리가 존재합니다. 하위 항목을 먼저 삭제하거나 이동해주세요.',
            });
        }

        // ------------------------------
        // 매핑 상품 확인
        // ------------------------------

        const {
            count: productCount,
            error: productError,
        } = await supabase
            .from('product_categories')
            .select(
                'product_id',
                {
                    count: 'exact',
                    head: true,
                },
            )
            .eq('category_id', id);

        if (productError) {
            throw productError;
        }

        if (
            (productCount ?? 0) > 0
        ) {
            return res.status(409).json({
                success: false,
                message:
                    `해당 카테고리에 매핑된 상품이 ${productCount}개 존재합니다. 상품 카테고리를 먼저 변경해주세요.`,
            });
        }

        // ------------------------------
        // Delete
        // ------------------------------

        const {
            error: deleteError,
        } = await supabase
            .from('categories')
            .delete()
            .eq('category_id', id);

        if (deleteError) {
            throw deleteError;
        }

        res.json({
            success: true,
            message:
                '카테고리가 삭제되었습니다.',
        });
    } catch (error) {
        console.error(
            'deleteCategory failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '카테고리 삭제에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};