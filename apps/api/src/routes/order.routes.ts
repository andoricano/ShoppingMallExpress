// routes/order.routes.ts

import { Router } from "express";

import {
    createOrder,
    getOrders,
    getOrderById,
    processShipment,
    cancelOrder,
    completeOrder,
} from "../controllers/order.controller.js";

const router: Router = Router();

// ==========================================
// Client 주문
// ==========================================

// POST /api/orders
// 주문 생성 요청
router.post("/", createOrder);

// GET /api/orders/:id
// 자신의 주문 상세 조회
router.get("/:id", getOrderById);

// PATCH /api/orders/:id/complete
// 배송 완료 확정
router.patch("/:id/complete", completeOrder);


// ==========================================
// Admin 주문
// ==========================================

// GET /api/orders
// 전체 주문 조회
router.get("/", getOrders);

// PATCH /api/orders/:id/shipping
// 출고 처리 및 배송 정보 등록
router.patch("/:id/shipping", processShipment);

// PATCH /api/orders/:id/cancel
// 주문 취소
router.patch("/:id/cancel", cancelOrder);

export default router;