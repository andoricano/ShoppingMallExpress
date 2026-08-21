// controllers/product.controller.ts

import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type {
    AdminProductFilterParams,
    ClientProductFilterParams,
    CreateProductPayload,
    UpdateProductPayload,
    BatchUpdateStatusPayload,
    BatchUpdateCategoryPayload,
    ProductStatus
} from '@mall/types';

// ==========================================
// 1. 어드민: 상품 목록 조회 (검색/필터/페이징)
// PRD 3.2: 카테고리, 판매 상태, 검색어 필터 지원
// ==========================================
export const getAdminProducts = async (
    req: Request<{}, {}, {}, AdminProductFilterParams>,
    res: Response
) => {
    try {
        const { searchQuery, status, categoryId, page = 1, limit = 20 } = req.query;

        // 삭제되지 않은 상품 전체 조회 (또는 특정 status 필터)
        let query = supabase.from('products').select(`
            *,
            options:product_options(*),
            categories:product_categories(category_id)
        `, { count: 'exact' });

        // PRD 3.4: 'DELETED' 상태가 아닌 상품만 기본 조회 (status가 지정되지 않은 경우)
        if (status) {
            query = query.eq('status', status);
        } else {
            query = query.neq('status', 'DELETED');
        }

        // 상품명 또는 상품 ID 검색
        if (searchQuery) {
            query = query.or(`product_name.ilike.%${searchQuery}%,product_id.ilike.%${searchQuery}%`);
        }

        // 특정 카테고리 필터 (조인 테이블 조건)
        if (categoryId) {
            query = query.eq('product_categories.category_id', categoryId);
        }

        // 페이지네이션 적용
        const from = (Number(page) - 1) * Number(limit);
        const to = from + Number(limit) - 1;
        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            pagination: {
                totalCount: count,
                currentPage: Number(page),
                totalPages: count ? Math.ceil(count / Number(limit)) : 0,
            },
        });
    } catch (error) {
        console.error('Admin products select failed:', error);
        res.status(500).json({
            success: false,
            message: '어드민 상품 목록 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. 클라이언트: 쇼핑몰 상품 목록 조회
// PRD 3.2: '진열중(DISPLAY)'만 노출, 정렬 옵션 지원
// ==========================================
export const getClientProducts = async (
    req: Request<{}, {}, {}, ClientProductFilterParams>,
    res: Response
) => {
    try {
        const { categoryId, sort = 'NEWEST', page = 1, limit = 20 } = req.query;

        // 클라이언트는 무조건 'DISPLAY' 상태의 상품만 조회
        let query = supabase.from('products').select(`
            product_id,
            product_name,
            main_image_url,
            base_price,
            discounted_price,
            discount_type,
            discount_value,
            status,
            sort_order,
            created_at,
            categories:product_categories!inner(category_id)
        `, { count: 'exact' }).eq('status', 'DISPLAY');

        // 카테고리 필터
        if (categoryId) {
            query = query.eq('product_categories.category_id', categoryId);
        }

        // 정렬 조건 처리 (PRD 3.2)
        switch (sort) {
            case 'RECOMMENDED':
                query = query.order('sort_order', { ascending: true }); // 상단 고정/우선순위
                break;
            case 'POPULAR':
                // 필요시 sales_count 또는 wishlist_count 기준 정렬
                query = query.order('sort_order', { ascending: true });
                break;
            case 'PRICE_ASC':
                query = query.order('discounted_price', { ascending: true });
                break;
            case 'PRICE_DESC':
                query = query.order('discounted_price', { ascending: false });
                break;
            case 'NEWEST':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }

        // 페이지네이션
        const from = (Number(page) - 1) * Number(limit);
        const to = from + Number(limit) - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            pagination: {
                totalCount: count,
                currentPage: Number(page),
                totalPages: count ? Math.ceil(count / Number(limit)) : 0,
            },
        });
    } catch (error) {
        console.error('Client products select failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 목록 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 3. 상품 상세 조회 (Direct URL 접근 제어)
// PRD 3.4: 삭제/숨김 상품 직접 접근 시 예외 처리
// ==========================================
export const getProductById = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const { data: product, error } = await supabase
            .from('products')
            .select(`
                *,
                options:product_options(*),
                categories:product_categories(category_id)
            `)
            .eq('product_id', id)
            .single();

        if (error || !product) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않거나 삭제된 상품입니다.',
            });
        }

        // PRD 3.4: Direct URL 접근 시 삭제/숨김 상태 체크
        if (product.status === 'DELETED' || product.status === 'HIDDEN') {
            return res.status(404).json({
                success: false,
                message: '존재하지 않거나 판매가 중단된 상품입니다.',
            });
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error('Select product detail failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 상세 정보 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 4. 어드민: 상품 신규 등록
// PRD 3.1: 마스터 생성 + 옵션(SKU 매핑) + 카테고리 연동
// ==========================================
export const createProduct = async (
    req: Request<{}, {}, CreateProductPayload>,
    res: Response
) => {
    try {
        const payload = req.body;

        // 1) 할인가 계산 로직 (정율 / 정액 반영)
        let discountedPrice = payload.basePrice;
        if (payload.discountType === 'FIXED_AMOUNT' && payload.discountValue) {
            discountedPrice = Math.max(0, payload.basePrice - payload.discountValue);
        } else if (payload.discountType === 'PERCENTAGE' && payload.discountValue) {
            discountedPrice = Math.max(0, payload.basePrice * (1 - payload.discountValue / 100));
        }

        // 2) 상품 마스터 생성
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
                product_name: payload.productName,
                main_image_url: payload.mainImageUrl,
                sub_image_urls: payload.subImageUrls || [],
                description: payload.description,
                status: payload.status,
                sort_order: payload.sortOrder || 0,
                base_price: payload.basePrice,
                discounted_price: discountedPrice,
                discount_type: payload.discountType,
                discount_value: payload.discountValue,
                discount_start_date: payload.discountStartDate,
                discount_end_date: payload.discountEndDate,
            })
            .select()
            .single();

        if (productError || !product) throw productError;

        const productId = product.product_id;

        // 3) 옵션 및 SKU 매핑 저장 (PRD 2.1)
        if (payload.options && payload.options.length > 0) {
            const optionRows = payload.options.map((opt) => ({
                product_id: productId,
                option_name: opt.optionName,
                option_value: opt.optionValue,
                surcharge: opt.surcharge || 0,
                sku_id: opt.skuId, // Inventory 모듈의 SKU ID 매핑
            }));

            const { error: optionError } = await supabase.from('product_options').insert(optionRows);
            if (optionError) throw optionError;
        }

        // 4) 카테고리 다중 매핑 저장 (PRD 3.5)
        if (payload.categoryIds && payload.categoryIds.length > 0) {
            const categoryRows = payload.categoryIds.map((catId) => ({
                product_id: productId,
                category_id: catId,
            }));

            const { error: categoryError } = await supabase.from('product_categories').insert(categoryRows);
            if (categoryError) throw categoryError;
        }

        res.status(201).json({
            success: true,
            message: '상품이 성공적으로 등록되었습니다.',
            data: { productId },
        });
    } catch (error) {
        console.error('Create product failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 등록에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 5. 어드민: 상품 정보 수정
// PRD 3.3: 정보 수정 시 관련 테이블 업데이트
// ==========================================
export const updateProduct = async (
    req: Request<{ id: string }, {}, UpdateProductPayload>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        // 1) 할인가 재계산
        let discountedPrice: number | undefined;
        if (payload.basePrice !== undefined) {
            discountedPrice = payload.basePrice;
            if (payload.discountType === 'FIXED_AMOUNT' && payload.discountValue) {
                discountedPrice = Math.max(0, payload.basePrice - payload.discountValue);
            } else if (payload.discountType === 'PERCENTAGE' && payload.discountValue) {
                discountedPrice = Math.max(0, payload.basePrice * (1 - payload.discountValue / 100));
            }
        }

        // 2) 상품 마스터 업데이트
        const { error: updateError } = await supabase
            .from('products')
            .update({
                ...(payload.productName && { product_name: payload.productName }),
                ...(payload.mainImageUrl && { main_image_url: payload.mainImageUrl }),
                ...(payload.subImageUrls && { sub_image_urls: payload.subImageUrls }),
                ...(payload.description && { description: payload.description }),
                ...(payload.status && { status: payload.status }),
                ...(payload.sortOrder !== undefined && { sort_order: payload.sortOrder }),
                ...(payload.basePrice !== undefined && { base_price: payload.basePrice }),
                ...(discountedPrice !== undefined && { discounted_price: discountedPrice }),
                ...(payload.discountType && { discount_type: payload.discountType }),
                ...(payload.discountValue !== undefined && { discount_value: payload.discountValue }),
                updated_at: new Date().toISOString(),
            })
            .eq('product_id', id);

        if (updateError) throw updateError;

        // 3) 카테고리 재매핑 (전체 삭제 후 재삽입)
        if (payload.categoryIds) {
            await supabase.from('product_categories').delete().eq('product_id', id);

            if (payload.categoryIds.length > 0) {
                const categoryRows = payload.categoryIds.map((catId) => ({
                    product_id: id,
                    category_id: catId,
                }));
                await supabase.from('product_categories').insert(categoryRows);
            }
        }

        res.json({
            success: true,
            message: '상품 정보가 수정되었습니다.',
        });
    } catch (error) {
        console.error('Update product failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 수정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 6. 어드민: 상품 삭제 (Soft Delete)
// PRD 3.4: 'DELETED' 상태로 변경하여 무결성 유지
// ==========================================
export const deleteProduct = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('products')
            .update({
                status: 'DELETED',
                updated_at: new Date().toISOString(),
            })
            .eq('product_id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: '상품이 삭제 처리되었습니다.',
        });
    } catch (error) {
        console.error('Delete product failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 삭제 처리에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 7. 어드민: 상품 진열 상태 일괄 변경
// PRD 3.2: Batch Action (진열중 ↔ 숨김)
// ==========================================
export const batchUpdateStatus = async (
    req: Request<{}, {}, BatchUpdateStatusPayload>,
    res: Response
) => {
    try {
        const { productIds, status } = req.body;

        const { error } = await supabase
            .from('products')
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .in('product_id', productIds);

        if (error) throw error;

        res.json({
            success: true,
            message: `${productIds.length}개 상품의 진열 상태가 변경되었습니다.`,
        });
    } catch (error) {
        console.error('Batch update status failed:', error);
        res.status(500).json({
            success: false,
            message: '상태 일괄 변경에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 8. 어드민: 상품 카테고리 일괄 이동
// PRD 3.2: Batch Action (다중 선택 상품 카테고리 이동)
// ==========================================
export const batchUpdateCategory = async (
    req: Request<{}, {}, BatchUpdateCategoryPayload>,
    res: Response
) => {
    try {
        const { productIds, targetCategoryIds } = req.body;

        // 1) 대상 상품들의 기존 카테고리 연동 삭제
        await supabase
            .from('product_categories')
            .delete()
            .in('product_id', productIds);

        // 2) 신규 카테고리 매핑 데이터 일괄 생성
        const newRows = productIds.flatMap((pId) =>
            targetCategoryIds.map((cId) => ({
                product_id: pId,
                category_id: cId,
            }))
        );

        const { error } = await supabase.from('product_categories').insert(newRows);
        if (error) throw error;

        res.json({
            success: true,
            message: `${productIds.length}개 상품의 카테고리가 일괄 변경되었습니다.`,
        });
    } catch (error) {
        console.error('Batch update category failed:', error);
        res.status(500).json({
            success: false,
            message: '카테고리 일괄 이동에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 9. 클라이언트: 관심상품(위시리스트) 등록/해제 Toggle
// PRD 3.7: 하트 클릭 시 위시리스트 토글
// ==========================================
export const toggleWishlist = async (
    req: Request<{}, {}, { userId: string; productId: string }>,
    res: Response
) => {
    try {
        const { userId, productId } = req.body;

        // 기존 위시리스트 존재 여부 확인
        const { data: existing } = await supabase
            .from('wishlists')
            .select('wishlist_id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            // 존재하면 해제 (삭제)
            await supabase.from('wishlists').delete().eq('wishlist_id', existing.wishlist_id);
            return res.json({
                success: true,
                isWished: false,
                message: '관심상품에서 제거되었습니다.',
            });
        } else {
            // 없으면 등록 (생성)
            await supabase.from('wishlists').insert({ user_id: userId, product_id: productId });
            return res.json({
                success: true,
                isWished: true,
                message: '관심상품에 등록되었습니다.',
            });
        }
    } catch (error) {
        console.error('Toggle wishlist failed:', error);
        res.status(500).json({
            success: false,
            message: '관심상품 처리에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};