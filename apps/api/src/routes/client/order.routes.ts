// routes/client/order.routes.ts

import { Router } from "express";

import {
    createOrder,
    getOrderById,
} from "../../controllers/client/order.controller.js";

const router: Router = Router();

router.post("/", createOrder);
router.get("/:id", getOrderById);

export default router;