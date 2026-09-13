// routes/client/history.routes.ts

import { Router } from "express";
import { getMyHistory } from "../../controllers/client/clientHistory.controller.js";

const router: Router = Router();

// ==========================================
// Client History
// ==========================================

router.get("/", getMyHistory);

export default router;