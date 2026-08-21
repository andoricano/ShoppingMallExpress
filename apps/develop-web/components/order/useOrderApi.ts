// hooks/useOrderApi.ts

import { useState, useCallback } from 'react';
// 모노레포 공통 타입 패키지 사용
import type {
    PrepareCheckoutPayload,
    CreateOrderPayload,
} from '@mall/types';

export const useOrderApi = () => {
    // API 호출 진행 상태
    const [loading, setLoading] = useState(false);

    // 1. 주문서 미리보기 계산 (Mock)
    const prepareCheckout = useCallback(async (payload: PrepareCheckoutPayload) => {
        setLoading(true);
        // [서버 미가동] 콘솔에 요청 파라미터 로그 출력
        console.log('🚀 [MOCK API] prepareCheckout 호출:', payload);

        // [서버 미가동] 500ms 가상 비동기 지연 처리
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoading(false);

        // [서버 미가동] 모의 응답 데이터 반환
        return {
            success: true,
            data: {
                totalProductAmount: 50000,
                shippingFee: 0,
                discountAmount: 0,
                finalAmount: 50000,
                items: payload.items.map((item) => ({
                    productId: item.productId,
                    productName: '테스트 상품',
                    skuId: item.skuId,
                    price: 50000,
                    quantity: item.quantity,
                })),
            },
        };
    }, []);

    // 2. 주문 생성 및 재고 점유 (Mock)
    const createOrder = useCallback(async (payload: CreateOrderPayload) => {
        setLoading(true);
        // [서버 미가동] 콘솔에 요청 파라미터 로그 출력
        console.log('🚀 [MOCK API] createOrder 호출:', payload);

        // [서버 미가동] 500ms 가상 비동기 지연 처리
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoading(false);

        // [서버 미가동] 모의 응답 데이터 반환
        return {
            success: true,
            data: {
                orderId: `ORD_${Date.now()}`,
                orderStatus: 'PAYMENT_PENDING',
                holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            },
            message: '주문이 성공적으로 생성되었으며 재고가 10분간 점유되었습니다.',
        };
    }, []);

    // 3. 장바구니 담기 (Mock)
    const addToCart = useCallback(async (payload: { productId: string; optionSkuId?: string; quantity: number }) => {
        setLoading(true);
        // [서버 미가동] 콘솔에 요청 파라미터 로그 출력
        console.log('🚀 [MOCK API] addToCart 호출:', payload);

        await new Promise((resolve) => setTimeout(resolve, 300));
        setLoading(false);

        return {
            success: true,
            message: '장바구니에 담았습니다.',
        };
    }, []);

    // 4. 위시리스트 토글 (Mock)
    const toggleWishlist = useCallback(async (productId: string) => {
        setLoading(true);
        // [서버 미가동] 콘솔에 요청 파라미터 로그 출력
        console.log('🚀 [MOCK API] toggleWishlist 호출:', productId);

        await new Promise((resolve) => setTimeout(resolve, 300));
        setLoading(false);

        return {
            success: true,
            isWished: true,
            message: '관심상품에 추가되었습니다.',
        };
    }, []);

    return {
        loading,
        prepareCheckout,
        createOrder,
        addToCart,
        toggleWishlist,
    };
};