import { Router } from "express";

import {
    getAdminOverview,
} from "../controllers/adminOverview.controller.js";
import {
    requireAdmin,
} from "../middleware/requireAdmin.js";

const router: Router = Router();

router.get(
    "/",
    requireAdmin,
    getAdminOverview,
);

export default router;
