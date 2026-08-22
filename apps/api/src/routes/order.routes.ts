// routes/order.routes.ts

import { Router } from 'express';
import {
    toggleWishlist,
    getWishlist,
    getCartItems,
    addToCart,
    updateCartItem,
    deleteCartItems,
    prepareCheckout,
    createOrder,
    handlePaymentWebhook
} from '../controllers/order.controller.js';

const router = Router();

// ==========================================
// 1. 위시리스트 (Wishlist) 라우트 설정
// ==========================================
//관심상품 등록 및 삭제 토글 엔드포인트
router.post('/wishlist/toggle', toggleWishlist);

//  사용자의 관심상품 목록 조회 엔드포인트
router.get('/wishlist', getWishlist);

// ==========================================
// 2. 장바구니 (Cart) 라우트 설정
// ==========================================
// 장바구니 목록 조회 엔드포인트
router.get('/cart', getCartItems);

// 장바구니 상품 추가(또는 수량 합산) 엔드포인트
router.post('/cart', addToCart);

// 장바구니 항목 개별 수정(수량, 체크여부, 옵션) 엔드포인트
router.patch('/cart/:cartId', updateCartItem);

//장바구니 선택 항목 일괄 삭제 엔드포인트
router.delete('/cart', deleteCartItems);

// ==========================================
// 3. 주문 및 결제 (Order & Checkout) 라우트 설정
// ==========================================
// 주문서 작성 전 금액 사전 계산 엔드포인트
router.post('/orders/prepare', prepareCheckout);

// 주문 생성 및 10분 재고 임시 점유 엔드포인트
router.post('/orders', createOrder);

//  PG사 결제 상태 웹훅 처리 엔드포인트
router.post('/payments/webhook', handlePaymentWebhook);

export default router;