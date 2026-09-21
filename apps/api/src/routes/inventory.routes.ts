// routes/inventory.routes.ts

import { Router } from "express";

import {
    getInventoryItems,
    createInventoryItem,
    adjustInventoryStock,
    toggleInventoryStatus,
    updateInventoryItem,
    deleteInventoryItem,
} from "../controllers/inventory.controller.js";
import {
    requireAdmin,
} from "../middleware/requireAdmin.js";

const router: Router = Router();

router.use(requireAdmin);

// 재고 목록 / 검색
router.get("/", getInventoryItems);

// 신규 SKU 재고 등록
router.post("/", createInventoryItem);

// SKU 정보 수정
router.patch("/:id", updateInventoryItem);

// 재고 수동 조정
router.patch("/:id/stock", adjustInventoryStock);

// SKU 활성 / 비활성
router.patch("/:id/status", toggleInventoryStatus);

// 비활성 SKU 삭제
router.delete("/:id", deleteInventoryItem);

export default router;
