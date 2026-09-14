// routes/client/order.routes.ts

import { Router } from "express";

import {
    cancelOrder,
    createOrder,
    getOrderById,
    updateOrder,
} from "../../controllers/client/order.controller.js";

const router: Router = Router();

router.post("/", createOrder);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id", updateOrder);

export default router;