import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { toCamelCase } from '../utils/caseConverter.js';
import type { BatchUpdatePayload, CreateProductPayload, ProductAlertType, ProductFilterParams, ProductSortOption } from '@mall/types';
import { calculateDiscountedPrice } from '../utils/calculateDiscountedPrice.js';

// UUID 형식 검증 헬퍼
const isUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

// ==========================================
// Controllers
// ==========================================

// 1. 클라이언트 쇼핑몰 상품 목록 조회 (PRD 3.2: Read-Only Exhibition)
export const getClientProducts = async (
    req: Request<{}, {}, {}, ProductFilterParams>,
    res: Response
) => {
    try {
        const { categoryId, searchQuery, sort = 'RECOMMENDED' } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // 카테고리 필터링 여부에 따라 INNER JOIN(!inner) 매핑
        const categorySelect = categoryId
            ? 'categories:product_categories!inner(category_id)'
            : 'categories:product_categories(category_id)';

        let query = supabase
            .from('products')
            .select(
                `
        *,
        options:product_options(*),
        ${categorySelect}
      `,
                { count: 'exact' }
            )
            // PRD 3.2: 숨김(HIDDEN) 및 삭제됨(DELETED) 원천 제외
            .in('status', ['DISPLAY', 'SOLD_OUT']);

        // [수정] Alias인 'categories'를 통해 접근해야 PostgREST 파싱 에러가 발생하지 않음
        if (categoryId) {
            query = query.eq('categories.category_id', categoryId);
        }

        if (searchQuery) {
            query = query.ilike('product_name', `%${searchQuery}%`);
        }

        // PRD 3.2 정렬 조건 매핑
        switch (sort as ProductSortOption) {
            case 'NEWEST':
                query = query.order('created_at', { ascending: false });
                break;
            case 'POPULAR':
                query = query.order('sales_count', { ascending: false });
                break;
            case 'PRICE_ASC':
                query = query.order('discounted_price', { ascending: true });
                break;
            case 'PRICE_DESC':
                query = query.order('discounted_price', { ascending: false });
                break;
            case 'RECOMMENDED':
            default:
                query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
                break;
        }

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        res.json({
            success: true,
            data: toCamelCase(data),
            pagination: {
                page,
                limit,
                totalCount: count ?? 0,
                totalPages: count ? Math.ceil(count / limit) : 0,
            },
        });
    } catch (error) {
        console.error('getClientProducts failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 목록 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 2-1. 어드민 상품 목록 조회 (PRD 3.2)
export const getAdminProducts = async (
    req: Request<{}, {}, {}, ProductFilterParams>,
    res: Response
) => {
    try {
        const { status, searchQuery, categoryId } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const categorySelect = categoryId
            ? 'categories:product_categories!inner(category_id)'
            : 'categories:product_categories(category_id)';

        let query = supabase
            .from('products')
            .select(
                `
        *,
        options:product_options(*),
        ${categorySelect}
      `,
                { count: 'exact' }
            );

        if (status) {
            query = query.eq('status', status);
        } else {
            query = query.neq('status', 'DELETED');
        }

        // [수정] Alias인 'categories'를 통해 조건 지정
        if (categoryId) {
            query = query.eq('categories.category_id', categoryId);
        }

        // UUID 여부에 따라 파싱 에러 방지 처리
        if (searchQuery) {
            const cleanQuery = searchQuery.trim();
            if (isUUID(cleanQuery)) {
                query = query.or(`product_name.ilike.%${cleanQuery}%,product_id.eq.${cleanQuery}`);
            } else {
                query = query.ilike('product_name', `%${cleanQuery}%`);
            }
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        res.json({
            success: true,
            data: toCamelCase(data),
            pagination: {
                page,
                limit,
                totalCount: count ?? 0,
                totalPages: count ? Math.ceil(count / limit) : 0,
            },
        });
    } catch (error) {
        console.error('getAdminProducts failed:', error);
        res.status(500).json({
            success: false,
            message: '어드민 상품 목록 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 2-2. 어드민 상품 진열 상태 일괄 변경 (PRD 3.2: Batch Action)
export const batchUpdateStatus = async (
    req: Request<{}, {}, BatchUpdatePayload>,
    res: Response
) => {
    try {
        const { productIds, status } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || !status) {
            return res.status(400).json({
                success: false,
                message: 'productIds 배열과 변경할 status 항목은 필수입니다.',
            });
        }

        // [추가] UUID 형식 검증
        if (!productIds.every(isUUID)) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 상품 ID가 포함되어 있습니다.',
            });
        }

        const ALLOWED_STATUSES = ['DISPLAY', 'HIDDEN'];
        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "일괄 변경 가능한 상태는 'DISPLAY' 또는 'HIDDEN'만 가능합니다.",
            });
        }

        const { data, error } = await supabase
            .from('products')
            .update({ status })
            .in('product_id', productIds)
            .neq('status', 'DELETED')
            .select();

        if (error) throw error;

        res.json({
            success: true,
            message: `${data.length}개 상품의 상태가 변경되었습니다.`,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('batchUpdateStatus failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 상태 일괄 변경에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 2-3. 어드민 상품 카테고리 일괄 이동 (PRD 3.2: Batch Action)
export const batchUpdateCategory = async (
    req: Request<{}, {}, BatchUpdatePayload>,
    res: Response
) => {
    try {
        const { productIds, targetCategoryIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'productIds 배열은 필수이며 1개 이상이어야 합니다.',
            });
        }

        if (!targetCategoryIds || !Array.isArray(targetCategoryIds) || targetCategoryIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '이동할 targetCategoryIds 배열은 필수입니다.',
            });
        }

        // [추가] UUID 형식 사전 검증
        if (!productIds.every(isUUID) || !targetCategoryIds.every(isUUID)) {
            return res.status(400).json({
                success: false,
                message: '올바르지 않은 ID 형식이 포함되어 있습니다.',
            });
        }

        // 대상 카테고리 유효성 검증
        const { data: existingCategories, error: categoryError } = await supabase
            .from('categories')
            .select('category_id')
            .in('category_id', targetCategoryIds);

        if (categoryError) throw categoryError;

        if (!existingCategories || existingCategories.length !== targetCategoryIds.length) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 카테고리가 포함되어 있습니다.',
            });
        }

        // [롤백 대비] 기존 카테고리 매핑 백업 백업
        const { data: previousMappings, error: backupError } = await supabase
            .from('product_categories')
            .select('*')
            .in('product_id', productIds);

        if (backupError) throw backupError;

        // 기존 매핑 삭제
        const { error: deleteError } = await supabase
            .from('product_categories')
            .delete()
            .in('product_id', productIds);

        if (deleteError) throw deleteError;

        // 신규 매핑 레코드 생성
        const newMappings = productIds.flatMap((productId) =>
            targetCategoryIds.map((categoryId) => ({
                product_id: productId,
                category_id: categoryId,
            }))
        );

        const { data, error: insertError } = await supabase
            .from('product_categories')
            .insert(newMappings)
            .select();

        // 생성 실패 시 이전 카테고리 복구 (Rollback 시도)
        if (insertError) {
            if (previousMappings && previousMappings.length > 0) {
                await supabase.from('product_categories').insert(previousMappings);
            }
            throw insertError;
        }

        res.json({
            success: true,
            message: `${productIds.length}개 상품의 카테고리가 일괄 이동되었습니다.`,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('batchUpdateCategory failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 카테고리 일괄 이동에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 2-4. 어드민 상품 알림 목록 조회 (PRD 3.7: Admin Dashboard Widget & History)
export const getAdminAlerts = async (
    req: Request<{}, {}, {}, { isRead?: string; type?: ProductAlertType; limit?: string }>,
    res: Response
) => {
    try {
        const { isRead, type, limit } = req.query;

        let query = supabase
            .from('product_alerts')
            .select(`
        *,
        product:products(product_name, main_image_url)
      `)
            .order('created_at', { ascending: false });

        if (isRead !== undefined) {
            query = query.eq('is_read', isRead === 'true');
        }

        if (type) {
            query = query.eq('alert_type', type);
        }

        if (limit) {
            query = query.limit(Math.max(1, parseInt(limit, 10)));
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('getAdminAlerts failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 알림 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 3-1. 클라이언트 상품 상세 조회 (PRD 3.4: Direct URL 차단 대응)
export const getProductById = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (!isUUID(id)) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않거나 삭제된 상품입니다.',
            });
        }

        const { data, error } = await supabase
            .from('products')
            .select(
                `
        *,
        options:product_options(*),
        categories:product_categories(category_id)
      `
            )
            .eq('product_id', id)
            .single();

        if (error || !data || data.status === 'DELETED' || data.status === 'HIDDEN') {
            return res.status(404).json({
                success: false,
                message: '존재하지 않거나 삭제된 상품입니다.',
            });
        }

        res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('getProductById failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 상세 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 3-2. 어드민 상품 신규 등록 (PRD 3.1 & 3.6)
export const createProduct = async (
    req: Request<{}, {}, CreateProductPayload>,
    res: Response
) => {
    let createdProductId: string | null = null;

    try {
        const {
            productName,
            mainImageUrl,
            subImageUrls = [],
            description,
            status = 'DISPLAY',
            sortOrder = 0,
            basePrice,
            discountType,
            discountValue,
            discountStartDate,
            discountEndDate,
            categoryIds = [],
            options = [],
        } = req.body;

        if (!productName || !mainImageUrl || basePrice === undefined) {
            return res.status(400).json({
                success: false,
                message: '상품명, 대표 이미지, 기본 가격은 필수 입력 항목입니다.',
            });
        }

        if (!['DISPLAY', 'HIDDEN'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '초기 등록 시 상품 상태는 DISPLAY 또는 HIDDEN만 지정할 수 있습니다.',
            });
        }

        const calculatedDiscountedPrice = calculateDiscountedPrice(
            basePrice,
            discountType,
            discountValue,
            discountStartDate,
            discountEndDate
        );

        const { data: productData, error: productError } = await supabase
            .from('products')
            .insert({
                product_name: productName,
                main_image_url: mainImageUrl,
                sub_image_urls: subImageUrls,
                description,
                status,
                sort_order: sortOrder,
                base_price: basePrice,
                discounted_price: calculatedDiscountedPrice,
                discount_type: discountType,
                discount_value: discountValue,
                discount_start_date: discountStartDate,
                discount_end_date: discountEndDate,
            })
            .select()
            .single();

        if (productError) throw productError;
        createdProductId = productData.product_id;

        if (categoryIds.length > 0) {
            const categoryRows = categoryIds.map((catId) => ({
                product_id: createdProductId,
                category_id: catId,
            }));
            const { error: catError } = await supabase.from('product_categories').insert(categoryRows);
            if (catError) throw catError;
        }

        if (options.length > 0) {
            const optionRows = options.map((opt) => ({
                product_id: createdProductId,
                option_name: opt.optionName,
                option_value: opt.optionValue,
                surcharge: opt.surcharge ?? 0,
                sku_id: opt.skuId,
            }));
            const { error: optError } = await supabase.from('product_options').insert(optionRows);
            if (optError) throw optError;
        }

        const { data: fullProduct, error: fetchError } = await supabase
            .from('products')
            .select(
                `
        *,
        options:product_options(*),
        categories:product_categories(category_id)
      `
            )
            .eq('product_id', createdProductId)
            .single();

        if (fetchError) throw fetchError;

        res.status(201).json({
            success: true,
            message: '상품이 성공적으로 등록되었습니다.',
            data: toCamelCase(fullProduct),
        });
    } catch (error) {
        console.error('createProduct failed:', error);

        if (createdProductId) {
            await supabase.from('products').delete().eq('product_id', createdProductId);
        }

        res.status(500).json({
            success: false,
            message: '상품 신규 등록에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 3-3. 어드민 상품 정보 수정 (PRD 3.3 & 3.6)
export const updateProduct = async (
    req: Request<{ id: string }, {}, Partial<CreateProductPayload>>,
    res: Response
) => {
    try {
        const { id } = req.params;

        if (!isUUID(id)) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 상품입니다.',
            });
        }

        const { data: currentProduct, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('product_id', id)
            .single();

        if (fetchError || !currentProduct) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 상품입니다.',
            });
        }

        const {
            productName,
            mainImageUrl,
            subImageUrls,
            description,
            status,
            sortOrder,
            basePrice,
            discountType,
            discountValue,
            discountStartDate,
            discountEndDate,
            categoryIds,
            options,
        } = req.body;

        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (productName !== undefined) updatePayload.product_name = productName;
        if (mainImageUrl !== undefined) updatePayload.main_image_url = mainImageUrl;
        if (subImageUrls !== undefined) updatePayload.sub_image_urls = subImageUrls;
        if (description !== undefined) updatePayload.description = description;
        if (status !== undefined) updatePayload.status = status;
        if (sortOrder !== undefined) updatePayload.sort_order = sortOrder;
        if (basePrice !== undefined) updatePayload.base_price = basePrice;
        if (discountType !== undefined) updatePayload.discount_type = discountType;
        if (discountValue !== undefined) updatePayload.discount_value = discountValue;
        if (discountStartDate !== undefined) updatePayload.discount_start_date = discountStartDate;
        if (discountEndDate !== undefined) updatePayload.discount_end_date = discountEndDate;

        const isDiscountRelatedUpdate =
            basePrice !== undefined ||
            discountType !== undefined ||
            discountValue !== undefined ||
            discountStartDate !== undefined ||
            discountEndDate !== undefined;

        if (isDiscountRelatedUpdate) {
            updatePayload.discounted_price = calculateDiscountedPrice(
                basePrice ?? currentProduct.base_price,
                discountType ?? currentProduct.discount_type,
                discountValue ?? currentProduct.discount_value,
                discountStartDate ?? currentProduct.discount_start_date,
                discountEndDate ?? currentProduct.discount_end_date
            );
        }

        const { error: updateError } = await supabase
            .from('products')
            .update(updatePayload)
            .eq('product_id', id);

        if (updateError) throw updateError;

        if (categoryIds !== undefined) {
            const { error: delCatErr } = await supabase.from('product_categories').delete().eq('product_id', id);
            if (delCatErr) throw delCatErr;

            if (categoryIds.length > 0) {
                const catRows = categoryIds.map((catId) => ({
                    product_id: id,
                    category_id: catId,
                }));
                const { error: insCatErr } = await supabase.from('product_categories').insert(catRows);
                if (insCatErr) throw insCatErr;
            }
        }

        if (options !== undefined) {
            const { error: delOptErr } = await supabase.from('product_options').delete().eq('product_id', id);
            if (delOptErr) throw delOptErr;

            if (options.length > 0) {
                const optRows = options.map((opt) => ({
                    product_id: id,
                    option_name: opt.optionName,
                    option_value: opt.optionValue,
                    surcharge: opt.surcharge ?? 0,
                    sku_id: opt.skuId,
                }));
                const { error: insOptErr } = await supabase.from('product_options').insert(optRows);
                if (insOptErr) throw insOptErr;
            }
        }

        const { data: updatedProduct, error: refetchError } = await supabase
            .from('products')
            .select(
                `
        *,
        options:product_options(*),
        categories:product_categories(category_id)
      `
            )
            .eq('product_id', id)
            .single();

        if (refetchError) throw refetchError;

        res.json({
            success: true,
            message: '상품 정보가 수정되었습니다.',
            data: toCamelCase(updatedProduct),
        });
    } catch (error) {
        console.error('updateProduct failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 정보 수정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 3-4. 어드민 상품 삭제 (PRD 3.4: Soft Delete)
export const deleteProduct = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        if (!isUUID(id)) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 상품입니다.',
            });
        }

        const { data, error } = await supabase
            .from('products')
            .update({
                status: 'DELETED',
                updated_at: new Date().toISOString(),
            })
            .eq('product_id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: '존재하지 않는 상품입니다.',
                });
            }
            throw error;
        }

        res.json({
            success: true,
            message: '상품이 삭제(Soft Delete) 처리되었습니다.',
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('deleteProduct failed:', error);
        res.status(500).json({
            success: false,
            message: '상품 삭제 처리에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};