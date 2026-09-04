import { Router } from "express";

import {
    getAdminProductPosts,
    getProductPostById,
    createProductPost,
    updateProductPost,
    toggleProductPostStatus,
    deleteProductPost,
} from "../controllers/productPost.controller.js";

const router: Router = Router();

// ==========================================
// Admin 상품 게시물 API
// ==========================================

// GET /api/admin/product-posts
// 전체 상품 게시물 조회
router.get(
    "/admin/product-posts",
    getAdminProductPosts,
);

// GET /api/admin/product-posts/:id
// 상품 게시물 상세 조회
router.get(
    "/admin/product-posts/:id",
    getProductPostById,
);

// POST /api/admin/product-posts
// 상품 게시물 + Product 신규 등록
router.post(
    "/admin/product-posts",
    createProductPost,
);

// PATCH /api/admin/product-posts/:id
// 상품 게시물 + Product 수정
router.patch(
    "/admin/product-posts/:id",
    updateProductPost,
);

// PATCH /api/admin/product-posts/:id/status
// 상품 게시물 공개 / 비공개
router.patch(
    "/admin/product-posts/:id/status",
    toggleProductPostStatus,
);

// DELETE /api/admin/product-posts/:id
// 상품 게시물 삭제
router.delete(
    "/admin/product-posts/:id",
    deleteProductPost,
);

export default router;