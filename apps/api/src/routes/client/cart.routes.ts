// routes/client/cart.router.ts

import { Router } from "express";

import {
    getCart,
    addCart,
    removeCart,
} from "../../controllers/client/cart.controller.js";

const router: Router = Router();

// ==========================================
// Client Cart
// ==========================================

router.get(
    "/",
    getCart,
);

router.post(
    "/",
    addCart,
);

router.delete(
    "/:productId",
    removeCart,
);

export default router;