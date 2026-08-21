// controllers/order.controller.ts

import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type {
    PrepareCheckoutPayload,
    CreateOrderPayload,
    StockStatus
} from '@mall/types';

// ==========================================
// [추가] 3.1 관심상품(위시리스트) 관리
// ==========================================

// 1. 위시리스트 토글 (등록/삭제)
export const toggleWishlist = async (req: Request, res: Response) => {
    try {
        const { userId, productId } = req.body;

        // 기존 등록 여부 확인
        const { data: existing } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .maybeSingle();

        if (existing) {
            // 이미 존재하면 삭제
            const { error } = await supabase
                .from('wishlists')
                .delete()
                .eq('id', existing.id);

            if (error) throw error;

            res.json({ success: true, isWished: false, message: '관심상품에서 삭제되었습니다.' });
        } else {
            // 없으면 추가
            const { error } = await supabase
                .from('wishlists')
                .insert({ user_id: userId, product_id: productId });

            if (error) throw error;

            res.json({ success: true, isWished: true, message: '관심상품에 추가되었습니다.' });
        }
    } catch (error) {
        console.error('Wishlist toggle failed:', error);
        res.status(500).json({ success: false, message: '관심상품 처리에 실패했습니다.' });
    }
};

// 2. 위시리스트 목록 조회
export const getWishlist = async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || (req as any).user?.id;

        const { data, error } = await supabase
            .from('wishlists')
            .select(`
                id,
                created_at,
                products (*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get wishlist failed:', error);
        res.status(500).json({ success: false, message: '관심상품 목록 조회에 실패했습니다.' });
    }
};

// ==========================================
// [추가] 3.2 장바구니 관리
// ==========================================

// 1. 장바구니 목록 조회
export const getCartItems = async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || (req as any).user?.id;

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                products (product_name, base_price, discounted_price)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get cart failed:', error);
        res.status(500).json({ success: false, message: '장바구니 조회에 실패했습니다.' });
    }
};

// 2. 장바구니 담기
export const addToCart = async (req: Request, res: Response) => {
    try {
        const { userId, productId, optionSkuId, quantity } = req.body;

        // 기존 장바구니 수량 중복 체크
        const { data: existing } = await supabase
            .from('cart_items')
            .select('cart_id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .eq('option_sku_id', optionSkuId || null)
            .maybeSingle();

        if (existing) {
            // [수정] 이미 담긴 동일 옵션 상품이면 수량 합산
            const { data, error } = await supabase
                .from('cart_items')
                .update({
                    quantity: existing.quantity + (quantity || 1),
                    updated_at: new Date().toISOString()
                })
                .eq('cart_id', existing.cart_id)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data, message: '장바구니 수량이 추가되었습니다.' });
        } else {
            // 새로 추가
            const { data, error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: userId,
                    product_id: productId,
                    option_sku_id: optionSkuId || null,
                    quantity: quantity || 1,
                    is_checked: true
                })
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data, message: '장바구니에 담았습니다.' });
        }
    } catch (error) {
        console.error('Add to cart failed:', error);
        res.status(500).json({ success: false, message: '장바구니 담기에 실패했습니다.' });
    }
};

// 3. 장바구니 수량/옵션/선택 상태 변경
export const updateCartItem = async (req: Request<{ cartId: string }>, res: Response) => {
    try {
        const { cartId } = req.params;
        const { quantity, isChecked, optionSkuId } = req.body;

        const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        if (quantity !== undefined) updateData.quantity = quantity;
        if (isChecked !== undefined) updateData.is_checked = isChecked;
        if (optionSkuId !== undefined) updateData.option_sku_id = optionSkuId;

        const { data, error } = await supabase
            .from('cart_items')
            .update(updateData)
            .eq('cart_id', cartId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Update cart item failed:', error);
        res.status(500).json({ success: false, message: '장바구니 수정에 실패했습니다.' });
    }
};

// 4. 장바구니 선택 삭제 및 일괄 삭제
export const deleteCartItems = async (req: Request, res: Response) => {
    try {
        const { cartIds } = req.body; // 배열 형태로 삭제할 항목 수신

        if (!cartIds || cartIds.length === 0) {
            res.status(400).json({ success: false, message: '삭제할 항목이 지정되지 않았습니다.' });
            return;
        }

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .in('cart_id', cartIds);

        if (error) throw error;

        res.json({ success: true, message: '선택한 장바구니 항목이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete cart items failed:', error);
        res.status(500).json({ success: false, message: '장바구니 삭제에 실패했습니다.' });
    }
};

// ==========================================
// 3.3 & 3.4 주문서 작성 및 주문 생성
// ==========================================

// 1. 주문서 미리보기 금액 계산 (3.3)
export const prepareCheckout = async (
    req: Request<{}, {}, PrepareCheckoutPayload>,
    res: Response
) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            res.status(400).json({ success: false, message: '주문할 상품 항목이 없습니다.' });
            return;
        }

        const productIds = items.map((i) => i.productId);
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('product_id, product_name, base_price, discounted_price')
            .in('product_id', productIds);

        if (productError) throw productError;

        let totalProductAmount = 0;
        const checkoutItems = items.map((item) => {
            const product = products?.find((p) => p.product_id === item.productId);
            const unitPrice = product?.discounted_price ?? product?.base_price ?? 0;
            const itemTotal = unitPrice * item.quantity;
            totalProductAmount += itemTotal;

            return {
                productId: item.productId,
                productName: product?.product_name || '상품',
                optionName: undefined,
                skuId: item.skuId,
                price: unitPrice,
                quantity: item.quantity,
            };
        });

        const shippingFee = totalProductAmount >= 50000 || totalProductAmount === 0 ? 0 : 3000;
        const discountAmount = 0;
        const finalAmount = totalProductAmount + shippingFee - discountAmount;

        res.json({
            success: true,
            data: {
                totalProductAmount,
                shippingFee,
                discountAmount,
                finalAmount,
                items: checkoutItems,
            },
        });
    } catch (error) {
        console.error('Prepare checkout failed:', error);
        res.status(500).json({ success: false, message: '주문서 계산 실패' });
    }
};

// 2. 주문 생성 및 재고 임시 점유 (3.4)
export const createOrder = async (
    req: Request<{}, {}, CreateOrderPayload & { userId?: string }>,
    res: Response
) => {
    try {
        const { shippingInfo, items, userId } = req.body;
        const targetUserId = userId || (req as any).user?.id;

        if (!targetUserId || !items || items.length === 0) {
            res.status(400).json({ success: false, message: '잘못된 요청 데이터입니다.' });
            return;
        }

        const productIds = items.map((i) => i.productId);
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('product_id, product_name, base_price, discounted_price')
            .in('product_id', productIds);

        if (productError) throw productError;

        let totalProductAmount = 0;
        const orderItemsData = items.map((item) => {
            const product = products?.find((p) => p.product_id === item.productId);
            const price = product?.discounted_price ?? product?.base_price ?? 0;
            totalProductAmount += price * item.quantity;

            return {
                product_id: item.productId,
                option_id: item.optionId || null,
                sku_id: item.skuId,
                product_name: product?.product_name || '상품명',
                price,
                quantity: item.quantity,
            };
        });

        const shippingFee = totalProductAmount >= 50000 ? 0 : 3000;
        const discountAmount = 0;
        const finalAmount = totalProductAmount + shippingFee - discountAmount;

        // [3.4 반영] 10분 재고 점유 만료 일시 (TTL)
        const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: targetUserId,
                order_status: 'PAYMENT_PENDING', // [3.4 반영] 결제대기
                recipient_name: shippingInfo.recipientName,
                recipient_phone: shippingInfo.recipientPhone,
                shipping_address: shippingInfo.shippingAddress,
                shipping_request: shippingInfo.shippingRequest || null,
                is_pickup: shippingInfo.isPickup || false,
                pickup_location: shippingInfo.pickupLocation || null,
                total_product_amount: totalProductAmount,
                shipping_fee: shippingFee,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                hold_expires_at: holdExpiresAt,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const formattedItems = orderItemsData.map((item) => ({
            ...item,
            order_id: order.order_id,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(formattedItems);

        if (itemsError) throw itemsError;

        res.status(201).json({
            success: true,
            data: order,
            message: '주문이 생성되고 재고가 10분간 점유되었습니다.',
        });
    } catch (error) {
        console.error('Create order failed:', error);
        res.status(500).json({ success: false, message: '주문 생성 실패' });
    }
};

// ==========================================
// [추가] 3.5 결제 상태 확인 및 전환 (PG Webhook)
// ==========================================
export const handlePaymentWebhook = async (req: Request, res: Response) => {
    try {
        const { orderId, paymentStatus } = req.body; // PG사로부터 수신된 결제 결과

        if (paymentStatus === 'SUCCESS') {
            // [3.5 반영] 결제대기 -> 주문접수(결제완료) 자동 전환
            const { data, error } = await supabase
                .from('orders')
                .update({
                    order_status: 'ORDER_RECEIVED', // PRD 명세: 주문접수
                    updated_at: new Date().toISOString()
                })
                .eq('order_id', orderId)
                .select()
                .single();

            if (error) throw error;

            res.json({ success: true, message: '주문 상태가 [주문접수]로 변경되었습니다.', data });
        } else {
            res.status(400).json({ success: false, message: '결제에 실패하여 상태를 변경하지 않습니다.' });
        }
    } catch (error) {
        console.error('Payment webhook processing failed:', error);
        res.status(500).json({ success: false, message: '결제 상태 처리 중 오류 발생' });
    }
};