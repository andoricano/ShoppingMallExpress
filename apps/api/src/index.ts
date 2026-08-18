import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import inventoryRoutes from './routes/inventory.routes.js';

const app = express();
const PORT: number = Number(process.env['PORT']) || 8080;

// [미들웨어 설정]
app.use(cors());
app.use(express.json());

// [서버 상태 헬스체크]
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ShoppingEx Admin Inventory API Server is running!',
    status: 'success',
  });
});

// [어드민 재고 관리 API 라우터 바인딩]
// GET    /api/inventory-items        : 재고 목록 조회 (검색/필터)
// GET    /api/inventory-items/logs   : 감사 로그(Audit Trail) 조회
// POST   /api/inventory-items        : 신규 SKU 및 초기 재고 등록
// POST   /api/inventory-items/adjust : 어드민 재고 수동 조정 (+/-)
// PATCH  /api/inventory-items/:uuid  : SKU 정보 수정
// DELETE /api/inventory-items/:uuid  : SKU 비활성화 (논리적 삭제)
app.use('/api/inventory-items', inventoryRoutes);

// [서버 실행]
app.listen(PORT, () => {
  console.log(`TypeScript Server running on port ${PORT}`);
});