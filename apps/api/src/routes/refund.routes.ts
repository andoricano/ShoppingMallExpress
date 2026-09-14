// routes/refund.routes.ts

import { Router } from "express";

import {
    getRefunds,
    processRefund,
} from "../controllers/refund.controller.js";

const router: Router = Router();

// ==========================================
// Refund
// ==========================================

router.get(
    "/",
    getRefunds,
);
router.patch(
    "/:id",
    processRefund,
);
export default router;