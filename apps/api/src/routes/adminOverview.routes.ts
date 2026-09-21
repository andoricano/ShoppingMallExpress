import { Router } from "express";

import {
    getAdminOverview,
} from "../controllers/adminOverview.controller.js";

const router: Router = Router();

router.get(
    "/",
    getAdminOverview,
);

export default router;
