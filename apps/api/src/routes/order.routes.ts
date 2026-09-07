// routes/admin/order.routes.ts

import { Router } from "express";
import { getOrderById, getOrders, updateOrderStatus } from "../controllers/order.controller.js";


const router: Router = Router();

// 주문 목록 조회
router.get("/", getOrders);

// 주문 상세 조회
router.get("/:id", getOrderById);

// 주문 상태 / 배송 정보 수정
router.patch("/:id", updateOrderStatus);

export default router;