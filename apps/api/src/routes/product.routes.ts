// routes/product.route.ts
import { Router } from 'express';
import { batchUpdateCategory, batchUpdateStatus, createProduct, deleteProduct, getAdminProducts, getClientProducts, getProductById, toggleWishlist, updateProduct } from '../controllers/product.controller.js';

const router: Router = Router();

// ==========================================
// 1. 클라이언트 전용 라우트
// ==========================================

// 1-1. 클라이언트 쇼핑몰 상품 목록 조회 (PRD 3.2: 진열중만 노출, 정렬 옵션 지원)
router.get('/client', getClientProducts);

// 1-2. 클라이언트 관심상품(위시리스트) 등록/해제 토글 (PRD 3.7)
router.post('/wishlist', toggleWishlist);


// ==========================================
// 2. 어드민 전용 라우트 (일괄 처리 및 목록)
// ==========================================

// 2-1. 어드민 상품 목록 조회 (PRD 3.2: 카테고리/상태/검색어 필터 및 페이징)
router.get('/admin', getAdminProducts);

// 2-2. 어드민 상품 진열 상태 일괄 변경 (PRD 3.2: Batch Action - 진열중 ↔ 숨김)
router.patch('/admin/batch-status', batchUpdateStatus);

// 2-3. 어드민 상품 카테고리 일괄 이동 (PRD 3.2: Batch Action)
router.patch('/admin/batch-category', batchUpdateCategory);


// ==========================================
// 3. 상품 단일 건 CRUD 라우트
// ==========================================

// 3-1. 상품 상세 조회 (PRD 3.4: 숨김/삭제 상품 Direct URL 직접 접근 차단)
router.get('/:id', getProductById);

// 3-2. 어드민 상품 신규 등록 (PRD 3.1: 원천 SKU 매핑 및 카테고리 다중 연동)
router.post('/', createProduct);

// 3-3. 어드민 상품 정보 수정 (PRD 3.3)
router.patch('/:id', updateProduct);

// 3-4. 어드민 상품 삭제 (PRD 3.4: Soft Delete 처리 - status를 DELETED로 변경)
router.delete('/:id', deleteProduct);

export default router;