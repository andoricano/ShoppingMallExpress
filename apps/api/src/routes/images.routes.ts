// routes/image.routes.ts

import { Router } from "express";
import { createImageUploadUrl } from "../controllers/images.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router: Router = Router();

router.use(requireAdmin);

router.post(
    "/images/upload-url",
    createImageUploadUrl,
);

export default router;
