import { Router } from 'express';

import {
  batchDeleteProduct,
  batchUpdateCategory,
  batchUpdateStatus,
  createProduct,
  deleteProduct,
  getAdminProducts,
  getClientProducts,
  getProductById,
  updateProduct,
} from '../controllers/product.controller.js';

const router: Router = Router();

// ==========================================
// 1. 클라이언트 상품 API
// ==========================================

// GET /api/products
// 클라이언트 상품 목록 조회
router.get('/products', getClientProducts);

// ==========================================
// 2. 어드민 상품 API
// ==========================================

// GET /api/admin/products
// 어드민 상품 목록 조회
router.get('/admin/products', getAdminProducts);

// POST /api/admin/products
// 상품 신규 등록
router.post('/admin/products', createProduct);

// GET /api/admin/products/:id
// 상품 상세 조회
router.get('/admin/products/:id', getProductById);

// PUT /api/admin/products/:id
// 상품 정보 수정
router.put('/admin/products/:id', updateProduct);

// DELETE /api/admin/products/:id
// 상품 Soft Delete
router.delete('/admin/products/:id', deleteProduct);

// ==========================================
// 3. 어드민 상품 일괄 관리
// ==========================================

// PATCH /api/admin/products/batch/status
// 상품 상태 일괄 변경
router.patch(
  '/admin/products/batch/status',
  batchUpdateStatus,
);

// PATCH /api/admin/products/batch/category
// 상품 카테고리 일괄 변경
router.patch(
  '/admin/products/batch/category',
  batchUpdateCategory,
);

// DELETE /api/admin/products/batch
// 상품 일괄 Soft Delete
router.delete(
  '/admin/products/batch',
  batchDeleteProduct,
);

export default router;