// routes/users.routes.ts

import { Router } from "express";

import {
    getUsers,
    updateUsers,
    deleteUsers,
} from "../controllers/user.controller.js";
import {
    requireAdmin,
} from "../middleware/requireAdmin.js";

const router: Router = Router();

router.use(requireAdmin);

// ==========================================
// 회원 관리 - Admin
// ==========================================

router.get("/", getUsers);

router.put("/", updateUsers);

router.delete("/", deleteUsers);

export default router;
