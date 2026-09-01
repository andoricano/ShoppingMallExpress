import { Router } from "express";
import { getDisplayProductById, getDisplayProducts } from "../../controllers/client/display.controller.js";



const router: Router = Router();

// GET /api/products
router.get("/", getDisplayProducts);

// GET /api/products/:id
router.get("/:id", getDisplayProductById);

export default router;