import { Router } from "express";
import { getDisplayProductPostById, getDisplayProductPosts } from "../../controllers/client/display.controller.js";

const router: Router = Router();

// GET /api/product-posts
router.get("/", getDisplayProductPosts);

// GET /api/product-posts/:id
router.get("/:id", getDisplayProductPostById);

export default router;