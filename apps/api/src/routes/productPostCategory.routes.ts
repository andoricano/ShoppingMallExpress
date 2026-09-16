// routes/admin/productPostCategory.routes.ts

import { Router } from "express";
import { createProductPostCategory, deleteProductPostCategory, getProductPostCategories, updateProductPostCategory } from "../controllers/productPostCategory.controller.js";

const router: Router = Router();

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

export default router;