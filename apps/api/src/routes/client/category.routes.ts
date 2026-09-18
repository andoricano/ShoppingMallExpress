import { Router } from "express";

import {
    getClientProductPostCategories,
    getClientProductPostsByCategory,
} from "../../controllers/client/category.controller.js";

const router: Router = Router();

// ==========================================
// Client Product Post Category
// ==========================================

// 카테고리 목록 조회
router.get(
    "/",
    getClientProductPostCategories,
);

// 특정 카테고리 게시물 조회
router.get(
    "/:categoryId/posts",
    getClientProductPostsByCategory,
);

export default router;