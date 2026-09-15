// routes/client/wishlist.router.ts

import { Router } from "express";
import { addWishlist, getWishlist, removeWishlist } from "../../controllers/client/wishList.controller.js";



const router: Router = Router();

// ==========================================
// Client Wishlist
// ==========================================

router.get(
    "/",
    getWishlist,
);

router.post(
    "/",
    addWishlist,
);

router.delete(
    "/:productId",
    removeWishlist,
);

export default router;