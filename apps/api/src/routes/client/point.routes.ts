// routes/client/point.routes.ts

import { Router } from "express";

import {
    getClientPoint,
    getClientPointTransactions,
    chargePoint,
} from "../../controllers/client/point.controller.js";

const router: Router = Router();

// ==========================================
// Client Point
// ==========================================

// 현재 포인트 조회
router.get(
    "/",
    getClientPoint,
);

// 포인트 거래 내역 조회
router.get(
    "/transactions",
    getClientPointTransactions,
);

// 포인트 충전
router.post(
    "/charge",
    chargePoint,
);

export default router;