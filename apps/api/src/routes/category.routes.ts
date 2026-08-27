// routes/category.routes.ts

import { Router } from 'express';

import {
    createCategory,
    deleteCategory,
    getCategoryTree,
    reorderCategories,
    updateCategory,
} from '../controllers/category.controller.js';

const router: Router = Router();

// ==========================================
// 카테고리 관리
// ==========================================

// GET /api/admin/categories/tree
// 전체 카테고리 트리 조회
router.get('/admin/categories/tree', getCategoryTree);

// POST /api/admin/categories
// 카테고리 신규 생성
router.post('/admin/categories', createCategory);

// PUT /api/admin/categories/:id
// 카테고리 정보 수정
router.put('/admin/categories/:id', updateCategory);

// PATCH /api/admin/categories/reorder
// 카테고리 순서 / 계층 일괄 변경
router.patch(
    '/admin/categories/reorder',
    reorderCategories,
);

// DELETE /api/admin/categories/:id
// 카테고리 삭제
router.delete('/admin/categories/:id', deleteCategory);

export default router;