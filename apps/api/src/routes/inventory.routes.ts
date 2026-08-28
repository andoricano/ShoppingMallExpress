// routes/inventory.routes.ts

import { Router } from 'express';

import {
    createInventoryItem,
    adjustInventoryStock,
    toggleInventoryStatus,
    updateInventoryItem,
    getInventoryItems,
} from '../controllers/inventory.controller.js';

const router: Router = Router();

// 재고 목록 / 조회
router.get('/', getInventoryItems);

// 신규 SKU / 재고 등록
router.post('/', createInventoryItem);

// 재고 수동 조정
router.patch('/:id/stock', adjustInventoryStock);

// SKU 정보 수정
router.patch('/:id', updateInventoryItem);

// SKU 활성 / 비활성
router.patch('/:id/status', toggleInventoryStatus);

export default router;