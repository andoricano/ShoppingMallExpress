import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import inventoryRoutes from './routes/inventory.routes.js'; // [수정] 분리된 재고 라우터 임포트

const app = express();
const PORT: number = Number(process.env['PORT']) || 8080;

app.use(cors());
app.use(express.json());

// [PostgreSQL DB 커넥션 풀 설정]
// 필요 시 다른 서비스나 컨트롤러에서 가져와 사용할 수 있도록 export
export const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
});

// [서버 상태 헬스체크]
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'ShoppingEx TypeScript API Server is running!',
        status: 'success',
    });
});

// [수정] 재고 관리 라우터 연결 (PRD 명세 반영 엔드포인트 모음)
// GET    /api/inventory-items        -> 재고 목록 조회 (검색/필터)
// GET    /api/inventory-items/logs   -> 어드민 감사 로그 조회
// POST   /api/inventory-items        -> 신규 SKU 및 초기 재고 등록
// POST   /api/inventory-items/adjust -> 어드민 수동 입출고 조정 (+/-)
// PATCH  /api/inventory-items/:uuid  -> SKU 정보 수정
// DELETE /api/inventory-items/:uuid  -> SKU 비활성화 (논리적 삭제)
app.use('/api/inventory-items', inventoryRoutes);

// [서버 실행]
app.listen(PORT, () => {
    console.log(`TypeScript Server running on port ${PORT}`);
});