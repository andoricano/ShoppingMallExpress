// routes/client/payment.routes.ts

import { Router } from "express";

import {
    reservePoint,
} from "../../controllers/client/payment.controller.js";

const router: Router = Router();

// ==========================================
// Client Payment
// ==========================================

router.post(
    "/point/reserve",
    reservePoint,
);

export default router;