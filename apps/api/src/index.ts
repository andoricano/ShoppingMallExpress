// index.ts (또는 server.ts)

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';

import inventoryRoutes from './routes/inventory.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js'; // 주석: 카테고리 라우터 모듈 추가

const app = express();
const PORT: number = Number(process.env['PORT']) || 8080;

// [2. 미들웨어 설정]
app.use(cors());
app.use(express.json());

// [3. 서버 상태 헬스체크]
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'ShoppingEx API Server is running!',
    status: 'success',
  });
});

// [4. API 라우터 바인딩]

// 모듈 2: 재고 관리 API
// - GET    /api/inventory-items        : 재고 목록 조회
// - GET    /api/inventory-items/logs   : 감사 로그 조회
// - POST   /api/inventory-items        : 신규 SKU 등록
// - POST   /api/inventory-items/adjust : 수동 입출고 조정
// - PATCH  /api/inventory-items/:uuid  : SKU 정보 수정
// - DELETE /api/inventory-items/:uuid  : SKU 비활성화
app.use('/api/inventory-items', inventoryRoutes);

// 모듈 3: 상품 관리 API 
// - GET    /api/products/client        : 클라이언트 상품 목록 조회 (진열중)
// - POST   /api/products/wishlist      : 관심상품 토글
// - GET    /api/products/admin         : 어드민 상품 목록 조회
// - PATCH  /api/products/admin/batch-status   : 상태 일괄 변경
// - PATCH  /api/products/admin/batch-category : 카테고리 일괄 이동
// - GET    /api/products/:id           : 상품 상세 조회
// - POST   /api/products               : 상품 신규 등록
// - PATCH  /api/products/:id           : 상품 정보 수정
// - DELETE /api/products/:id           : 상품 삭제 (Soft Delete)
app.use('/api/products', productRoutes);

// 모듈 4: 카테고리 관리 API 
// - GET    /api/categories               : 전체 카테고리 목록 조회
// - POST   /api/categories/admin         : 카테고리 신규 생성
// - PATCH  /api/categories/admin/:id     : 카테고리 정보 수정
// - DELETE /api/categories/admin/:id     : 카테고리 삭제
app.use('/api/categories', categoryRoutes);

// [5. 서버 실행]
app.listen(PORT, () => {
  console.log(`TypeScript Server running on port ${PORT}`);
});