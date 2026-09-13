// routes/users.routes.ts

import { Router } from "express";

import {
    getUsers,
    updateUsers,
    deleteUsers,
} from "../controllers/user.controller.js";

const router: Router = Router();

// ==========================================
// 회원 관리 - Admin
// ==========================================

router.get("/", getUsers);

router.put("/", updateUsers);

router.delete("/", deleteUsers);

export default router;