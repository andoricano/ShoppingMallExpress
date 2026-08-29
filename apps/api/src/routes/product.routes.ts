import { Router } from "express";

import {
  getClientProducts,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from "../controllers/product.controller.js";

const router: Router = Router();

// ==========================================
// 1. Client 상품 API
// ==========================================

// GET /api/products
// 활성 상품 목록 조회
router.get("/products", getClientProducts);

// ==========================================
// 2. Admin 상품 API
// ==========================================

// GET /api/admin/products
// 전체 상품 목록 조회
router.get("/admin/products", getAdminProducts);

// GET /api/admin/products/:id
// 상품 상세 조회
router.get("/admin/products/:id", getProductById);

// POST /api/admin/products
// 상품 신규 등록
router.post("/admin/products", createProduct);

// PATCH /api/admin/products/:id
// 상품 정보 수정
router.patch("/admin/products/:id", updateProduct);

// PATCH /api/admin/products/:id/status
// 상품 활성 / 비활성
router.patch("/admin/products/:id/status", toggleProductStatus);

// DELETE /api/admin/products/:id
// 비활성 상품 삭제
router.delete("/admin/products/:id", deleteProduct);

export default router;