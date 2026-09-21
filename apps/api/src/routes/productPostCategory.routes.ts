// routes/admin/productPostCategory.routes.ts

import { Router } from "express";

import {
    createProductPostCategory,
    deleteProductPostCategory,
    getProductPostCategories,
    updateProductPostCategory,
    addProductPostsToCategory,
    getProductPostsByCategory,
    removePostFromCategory,
} from "../controllers/productPostCategory.controller.js";
import {
    requireAdmin,
} from "../middleware/requireAdmin.js";

const router: Router = Router();

router.use(requireAdmin);

// ==========================================
// Category
// ==========================================

// Category 목록
router.get(
    "/",
    getProductPostCategories,
);

// Category 생성
router.post(
    "/",
    createProductPostCategory,
);

// Category 수정
router.patch(
    "/:id",
    updateProductPostCategory,
);

// Category 삭제
router.delete(
    "/:id",
    deleteProductPostCategory,
);

// ==========================================
// Category ↔ Product Post
// ==========================================

// Category에 Product Post 등록
router.post(
    "/:categoryId/posts",
    addProductPostsToCategory,
);

// Category의 Product Post Filtering
router.get(
    "/:categoryId/posts",
    getProductPostsByCategory,
);

// Category의 Product Post remove
router.delete(
    "/:categoryId/posts/:postId",
    removePostFromCategory,
);

export default router;
