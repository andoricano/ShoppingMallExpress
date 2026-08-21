// routes/category.routes.ts
import { Router } from 'express';
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory
} from '../controllers/category.controller.js'; 
const router: Router = Router();

// ==========================================
// 1. 공통/클라이언트 라우트
// ==========================================

// 1-1. 전체 카테고리 계층 목록 조회 (GET /api/categories)
router.get('/', getCategories);


// ==========================================
// 2. 어드민 전용 라우트
// ==========================================

// 2-1. 어드민 신규 카테고리 생성 (POST /api/categories/admin)
router.post('/admin', createCategory);

// 2-2. 어드민 카테고리 정보 수정 (PATCH /api/categories/admin/:categoryId)
router.patch('/admin/:categoryId', updateCategory);

// 2-3. 어드민 카테고리 삭제 (DELETE /api/categories/admin/:categoryId)
router.delete('/admin/:categoryId', deleteCategory);

export default router;