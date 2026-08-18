// routes/inventory.route.ts
import { Router } from 'express';
import {
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    adjustInventoryStock, // [추가] 수동 입출고 조정 (+/-) 및 감사로그 적재
    toggleInventoryStatus, // [추가] 비활성화(Disabled) 논리적 삭제 처리
    getInventoryLogs,     // [추가] 감사 로그 조회
} from '../controllers/inventory.controller.js';

const router: Router = Router();

// 1. 재고 목록 조회 (검색/필터)
router.get('/', getInventoryItems);

// 2. 감사 로그 전체/상세 조회 (PRD 3.6)
router.get('/logs', getInventoryLogs);

// 3. 신규 SKU 및 초기 재고 등록 (PRD 3.1)
router.post('/', createInventoryItem);

// 4. 어드민 재고 수동 조정 (입출고, 사유메모, Admin ID 필수) (PRD 3.3)
router.post('/adjust', adjustInventoryStock);

// 5. 단순 SKU 설정 수정 (안전재고 수량 변경 등)
router.patch('/:uuid', updateInventoryItem);

// 6. SKU 비활성화 / 활성화 (논리적 삭제) (PRD 3.7)
// DELETE /:uuid 요청 시 실제 삭제가 아닌 Disabled 상태 전환 처리
router.delete('/:uuid', toggleInventoryStatus);

export default router;