// controllers/category.controller.ts

import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type { ProductCategory } from '@mall/types';
import { DB_COLUMNS, DB_TABLES } from '@mall/constants';

// ==========================================
// 1. 카테고리 전체 목록 조회
// GET /api/categories
// ==========================================
export const getCategories = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from(DB_TABLES.CATEGORIES)
            .select('*')
            .order(DB_COLUMNS.CATEGORIES.DISPLAY_ORDER, { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Categories select failed:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 목록 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. 어드민: 신규 카테고리 생성
// POST /api/categories/admin
// ==========================================
export const createCategory = async (
    req: Request<{}, {}, Omit<ProductCategory, 'categoryId'>>,
    res: Response
) => {
    try {
        const payload = req.body;

        // 주석: 프론트엔드의 camelCase 데이터를 DB 컬럼명(snake_case)으로 변환하여 매핑
        const dbPayload = {
            category_name: (payload as any).categoryName || (payload as any).category_name,
            parent_id: (payload as any).parentId || (payload as any).parent_id || null,
            depth: (payload as any).depth ?? 1,
            display_order: (payload as any).displayOrder ?? (payload as any).display_order ?? 0,
        };

        const { data, error } = await supabase
            .from(DB_TABLES.CATEGORIES)
            .insert([dbPayload])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: '카테고리가 성공적으로 생성되었습니다.',
        });
    } catch (error) {
        console.error('Category creation failed:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 생성에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 3. 어드민: 카테고리 정보 수정
// PATCH /api/categories/admin/:categoryId
// ==========================================
export const updateCategory = async (
    req: Request<{ categoryId: string }, {}, Partial<ProductCategory>>,
    res: Response
) => {
    try {
        const { categoryId } = req.params;
        const payload = req.body as any;

        // 주석: 요청 들어온 camelCase 필드만 체크하여 DB snake_case 객체로 동적 매핑
        const dbPayload: Record<string, any> = {};
        if (payload.categoryName !== undefined) dbPayload.category_name = payload.categoryName;
        if (payload.category_name !== undefined) dbPayload.category_name = payload.category_name;
        if (payload.parentId !== undefined) dbPayload.parent_id = payload.parentId;
        if (payload.parent_id !== undefined) dbPayload.parent_id = payload.parent_id;
        if (payload.depth !== undefined) dbPayload.depth = payload.depth;
        if (payload.displayOrder !== undefined) dbPayload.display_order = payload.displayOrder;
        if (payload.display_order !== undefined) dbPayload.display_order = payload.display_order;

        const { data, error } = await supabase
            .from(DB_TABLES.CATEGORIES)
            .update(dbPayload)
            .eq(DB_COLUMNS.CATEGORIES.CATEGORY_ID, categoryId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
            message: '카테고리 정보가 수정되었습니다.',
        });
    } catch (error) {
        console.error('Category update failed:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 수정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 4. 어드민: 카테고리 삭제
// DELETE /api/categories/admin/:categoryId
// ==========================================
export const deleteCategory = async (
    req: Request<{ categoryId: string }>,
    res: Response
) => {
    try {
        const { categoryId } = req.params;

        const { error } = await supabase
            .from(DB_TABLES.CATEGORIES)
            .delete()
            .eq(DB_COLUMNS.CATEGORIES.CATEGORY_ID, categoryId);

        if (error) throw error;

        res.json({
            success: true,
            message: '카테고리가 삭제되었습니다.',
        });
    } catch (error) {
        console.error('Category deletion failed:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 삭제에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};