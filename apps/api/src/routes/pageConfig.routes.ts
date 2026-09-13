// routes/pageConfig.routes.ts

import { Router } from "express";
import { createMainPage, getMainPage, updateMainPage } from "../controllers/pageConfig.controller.js";


const router: Router = Router();

// 메인 페이지 설정 조회
router.get("/", getMainPage);

// 메인 페이지 설정 생성
router.post("/", createMainPage);

// 메인 페이지 설정 수정
router.patch("/", updateMainPage);

export default router;