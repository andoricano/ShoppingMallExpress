// routes/pageConfig.routes.ts

import { Router } from "express";

import {
    getPageConfig,
    updatePageConfig,
} from "../controllers/pageConfig.controller.js";

const router: Router = Router();

router.get("/:key", getPageConfig);
router.put("/:key", updatePageConfig);

export default router;