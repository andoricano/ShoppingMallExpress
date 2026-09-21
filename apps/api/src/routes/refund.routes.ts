// routes/refund.routes.ts

import { Router } from "express";

import {
    getRefunds,
    processRefund,
} from "../controllers/refund.controller.js";
import {
    requireAdmin,
} from "../middleware/requireAdmin.js";

const router: Router = Router();

router.use(requireAdmin);

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
