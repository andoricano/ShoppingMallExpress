// routes/client/order.routes.ts

import { Router } from "express";

import {
    createOrder,
} from "../../controllers/client/order.controller.js";

const router: Router = Router();

router.post("/", createOrder);

export default router;