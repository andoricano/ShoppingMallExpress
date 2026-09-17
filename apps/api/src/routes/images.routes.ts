// routes/image.routes.ts

import { Router } from "express";
import { createImageUploadUrl } from "../controllers/images.controller.js";

const router: Router = Router();

router.post(
    "/images/upload-url",
    createImageUploadUrl,
);

export default router;