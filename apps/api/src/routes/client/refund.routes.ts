// routes/client/refund.routes.ts

import { Router } from "express";

import {
    createRefundRequest,
} from "../../controllers/client/refund.controller.js";

const router: Router = Router();

// ==========================================
// Client Refund
// ==========================================

router.post(
    "/",
    createRefundRequest,
);

export default router;