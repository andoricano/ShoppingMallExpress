// controllers/product.controller.ts

import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { toCamelCase } from '../utils/caseConverter.js';

import type {
    ProductOption,
    ProductSortOption,
    ProductStatus,
} from '@mall/types';

// ==========================================
// Types
// ==========================================

interface ProductListQuery {
    page?: string;
    limit?: string;
    categoryId?: string;
    status?: ProductStatus;
    searchQuery?: string;
    sort?: ProductSortOption;
}

interface ProductCategoryPayload {
    productIds: string[];
    categoryIds: string[];
    mode: 'ADD' | 'REPLACE';
}

interface ProductStatusPayload {
    productIds: string[];
    status: Exclude<ProductStatus, 'DELETED'>;
}

interface ProductDeletePayload {
    productIds: string[];
}

// ==========================================
// Constants
// ==========================================

const PRODUCT_STATUS = {
    DISPLAY: 'DISPLAY',
    HIDDEN: 'HIDDEN',
    SOLD_OUT: 'SOLD_OUT',
    DELETED: 'DELETED',
} as const;

const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_SUB_IMAGE_COUNT = 10;

// ==========================================
// Helpers
// ==========================================

const getErrorMessage = (error: unknown) =>
    error instanceof Error
        ? error.message
        : JSON.stringify(error);

const isUUID = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );

const parsePage = (value?: string) => {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? page : 1;
};

const parseLimit = (value?: string) => {
    const limit = Number(value);

    if (!Number.isInteger(limit) || limit <= 0) {
        return 20;
    }

    return Math.min(limit, 100);
};

const isProductStatus = (
    value: string,
): value is ProductStatus =>
    Object.values(PRODUCT_STATUS).includes(
        value as ProductStatus,
    );

const isSortOption = (
    value: string,
): value is ProductSortOption =>
    [
        'RECOMMENDED',
        'NEWEST',
        'POPULAR',
        'PRICE_ASC',
        'PRICE_DESC',
    ].includes(value);

const calculateDiscountedPrice = (
    basePrice: number,
    discountType?: 'FIXED' | 'PERCENT',
    discountValue?: number,
) => {
    if (
        discountType === undefined ||
        discountValue === undefined
    ) {
        return basePrice;
    }

    if (discountType === 'PERCENT') {
        return Math.floor(
            basePrice * (100 - discountValue) / 100,
        );
    }

    return Math.max(
        0,
        basePrice - discountValue,
    );
};

const validateDiscount = (
    basePrice: number,
    discountType?: 'FIXED' | 'PERCENT',
    discountValue?: number,
    startDate?: string,
    endDate?: string,
) => {
    if (
        discountType === undefined &&
        discountValue === undefined &&
        startDate === undefined &&
        endDate === undefined
    ) {
        return null;
    }

    if (
        discountType !== 'FIXED' &&
        discountType !== 'PERCENT'
    ) {
        return '유효하지 않은 할인 유형입니다.';
    }

    if (discountValue === undefined) {
        return '할인값을 입력해주세요.';
    }

    if (!Number.isInteger(discountValue)) {
        return '할인값은 정수로 입력해주세요.';
    }

    if (discountType === 'PERCENT') {
        if (
            discountValue < 1 ||
            discountValue > 99
        ) {
            return '할인율은 1%에서 99% 사이여야 합니다.';
        }
    }

    if (discountType === 'FIXED') {
        if (
            discountValue < 0 ||
            discountValue >= basePrice
        ) {
            return '할인 금액은 기본가보다 작아야 합니다.';
        }
    }

    if (startDate && endDate) {
        if (
            new Date(endDate) <= new Date(startDate)
        ) {
            return '할인 종료 일시는 시작 일시보다 이후여야 합니다.';
        }
    }

    return null;
};

const validateProductOptions = (
    options: ProductOption[],
) => {
    if (!Array.isArray(options)) {
        return '상품 옵션 정보가 올바르지 않습니다.';
    }

    for (const option of options) {
        if (!option.optionName?.trim()) {
            return '옵션명을 입력해주세요.';
        }

        if (!option.optionValue?.trim()) {
            return '옵션값을 입력해주세요.';
        }

        if (!option.skuId) {
            return '모든 옵션에 원천 SKU를 매핑해주세요.';
        }

        if (
            !Number.isInteger(
                option.surcharge,
            )
        ) {
            return '옵션 추가 금액은 정수로 입력해주세요.';
        }
    }

    return null;
};

const validateCategoryIds = (
    categoryIds: string[],
) => {
    if (
        !Array.isArray(categoryIds) ||
        categoryIds.length === 0
    ) {
        return '최소 하나의 카테고리를 선택해야 합니다.';
    }

    if (
        categoryIds.some(
            categoryId => !isUUID(categoryId),
        )
    ) {
        return '유효하지 않은 카테고리 ID가 포함되어 있습니다.';
    }

    if (
        new Set(categoryIds).size !==
        categoryIds.length
    ) {
        return '동일한 카테고리를 중복 지정할 수 없습니다.';
    }

    return null;
};

// ==========================================
// 1. Client 상품 목록 조회
// GET /api/products
// ==========================================

export const getClientProducts = async (
    req: Request<
        {},
        {},
        {},
        ProductListQuery
    >,
    res: Response,
) => {
    try {
        const page = parsePage(req.query.page);
        const limit = parseLimit(req.query.limit);

        const categoryId =
            req.query.categoryId;

        const sort =
            req.query.sort ?? 'RECOMMENDED';

        if (
            categoryId &&
            !isUUID(categoryId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 카테고리 ID입니다.',
            });
        }

        if (!isSortOption(sort)) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 정렬 옵션입니다.',
            });
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('products')
            .select(
                `
                *,
                product_options(*),
                product_categories(category_id)
                `,
                {
                    count: 'exact',
                },
            )
            .in('status', [
                PRODUCT_STATUS.DISPLAY,
                PRODUCT_STATUS.SOLD_OUT,
            ]);

        if (categoryId) {
            query = query.eq(
                'product_categories.category_id',
                categoryId,
            );
        }

        switch (sort) {
            case 'NEWEST':
                query = query.order(
                    'created_at',
                    { ascending: false },
                );
                break;

            case 'POPULAR':
                query = query.order(
                    'sales_count',
                    { ascending: false },
                );
                break;

            case 'PRICE_ASC':
                query = query.order(
                    'discounted_price',
                    { ascending: true },
                );
                break;

            case 'PRICE_DESC':
                query = query.order(
                    'discounted_price',
                    { ascending: false },
                );
                break;

            case 'RECOMMENDED':
                query = query
                    .order(
                        'sort_order',
                        { ascending: true },
                    )
                    .order(
                        'created_at',
                        { ascending: false },
                    );
                break;
        }

        const {
            data,
            error,
            count,
        } = await query.range(from, to);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: toCamelCase(data ?? []),
            pagination: {
                page,
                limit,
                totalCount: count ?? 0,
                totalPages: count
                    ? Math.ceil(count / limit)
                    : 0,
            },
        });
    } catch (error) {
        console.error(
            'getClientProducts failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 목록 조회에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 2. Admin 상품 목록 조회
// GET /api/admin/products
// ==========================================

export const getAdminProducts = async (
    req: Request<
        {},
        {},
        {},
        ProductListQuery
    >,
    res: Response,
) => {
    try {
        const page = parsePage(req.query.page);
        const limit = parseLimit(req.query.limit);

        const {
            status,
            categoryId,
            searchQuery,
        } = req.query;

        if (
            categoryId &&
            !isUUID(categoryId)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 카테고리 ID입니다.',
            });
        }

        if (
            status &&
            !isProductStatus(status)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 상품 상태입니다.',
            });
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('products')
            .select(
                `
                *,
                product_options(*),
                product_categories(category_id)
                `,
                {
                    count: 'exact',
                },
            )
            .neq(
                'status',
                PRODUCT_STATUS.DELETED,
            );

        if (status) {
            query = query.eq(
                'status',
                status,
            );
        }

        if (categoryId) {
            query = query.eq(
                'product_categories.category_id',
                categoryId,
            );
        }

        if (searchQuery?.trim()) {
            const keyword =
                searchQuery.trim();

            if (isUUID(keyword)) {
                query = query.or(
                    `product_id.eq.${keyword},product_name.ilike.%${keyword}%`,
                );
            } else {
                query = query.ilike(
                    'product_name',
                    `%${keyword}%`,
                );
            }
        }

        query = query
            .order(
                'sort_order',
                { ascending: true },
            )
            .order(
                'created_at',
                { ascending: false },
            );

        const {
            data,
            error,
            count,
        } = await query.range(from, to);

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            data: toCamelCase(data ?? []),
            pagination: {
                page,
                limit,
                totalCount: count ?? 0,
                totalPages: count
                    ? Math.ceil(count / limit)
                    : 0,
            },
        });
    } catch (error) {
        console.error(
            'getAdminProducts failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 목록 조회에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 3. 상품 상세 조회
// GET /api/admin/products/:id
// ==========================================

export const getProductById = async (
    req: Request<{ id: string }>,
    res: Response,
) => {
    try {
        const { id } = req.params;

        if (!isUUID(id)) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 상품 ID입니다.',
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from('products')
            .select(
                `
                *,
                product_options(*),
                product_categories(category_id)
                `,
            )
            .eq('product_id', id)
            .single();

        if (error) {
            if (
                error.code ===
                'PGRST116'
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        '상품을 찾을 수 없습니다.',
                });
            }

            throw error;
        }

        res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            'getProductById failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 상세 조회에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 4. 상품 신규 등록
// POST /api/admin/products
// ==========================================

export const createProduct = async (
    req: Request<
        {},
        {},
        {
            productName: string;
            mainImageUrl: string;
            subImageUrls?: string[];
            description?: string;
            status?: Exclude<
                ProductStatus,
                'DELETED'
            >;
            sortOrder?: number;
            basePrice: number;
            discountType?: 'FIXED' | 'PERCENT';
            discountValue?: number;
            discountStartDate?: string;
            discountEndDate?: string;
            categoryIds: string[];
            options: ProductOption[];
        }
    >,
    res: Response,
) => {
    try {
        const payload = req.body;

        const productName =
            payload.productName?.trim();

        // 기본 정보
        if (
            !productName ||
            productName.length >
            MAX_PRODUCT_NAME_LENGTH
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '상품명을 입력해주세요. (최대 100자)',
            });
        }

        if (
            !Number.isInteger(
                payload.basePrice,
            ) ||
            payload.basePrice < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '올바른 기본가를 입력해주세요.',
            });
        }

        // 카테고리
        const categoryValidation =
            validateCategoryIds(
                payload.categoryIds,
            );

        if (categoryValidation) {
            return res.status(400).json({
                success: false,
                message:
                    categoryValidation,
            });
        }

        // 옵션
        const optionValidation =
            validateProductOptions(
                payload.options,
            );

        if (optionValidation) {
            return res.status(400).json({
                success: false,
                message:
                    optionValidation,
            });
        }

        // 이미지
        if (
            !payload.mainImageUrl?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '대표 이미지를 최소 1개 이상 등록해주세요.',
            });
        }

        if (
            payload.subImageUrls &&
            payload.subImageUrls.length >
            MAX_SUB_IMAGE_COUNT
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '추가 이미지는 최대 10개까지 등록할 수 있습니다.',
            });
        }

        // 할인
        const discountError =
            validateDiscount(
                payload.basePrice,
                payload.discountType,
                payload.discountValue,
                payload.discountStartDate,
                payload.discountEndDate,
            );

        if (discountError) {
            return res.status(400).json({
                success: false,
                message: discountError,
            });
        }

        const discountedPrice =
            calculateDiscountedPrice(
                payload.basePrice,
                payload.discountType,
                payload.discountValue,
            );

        // 상품 생성
        const {
            data: product,
            error: productError,
        } = await supabase
            .from('products')
            .insert({
                product_name:
                    productName,
                main_image_url:
                    payload.mainImageUrl,
                sub_image_urls:
                    payload.subImageUrls ?? [],
                description:
                    payload.description ?? '',
                status:
                    payload.status ??
                    PRODUCT_STATUS.DISPLAY,
                sort_order:
                    payload.sortOrder ?? 0,
                base_price:
                    payload.basePrice,
                discounted_price:
                    discountedPrice,
                discount_type:
                    payload.discountType ?? null,
                discount_value:
                    payload.discountValue ?? null,
                discount_start_date:
                    payload.discountStartDate ??
                    null,
                discount_end_date:
                    payload.discountEndDate ??
                    null,
            })
            .select()
            .single();

        if (productError) {
            throw productError;
        }

        // 카테고리 매핑
        const categoryRows =
            payload.categoryIds.map(
                categoryId => ({
                    product_id:
                        product.product_id,
                    category_id:
                        categoryId,
                }),
            );

        const {
            error: categoryError,
        } = await supabase
            .from('product_categories')
            .insert(categoryRows);

        if (categoryError) {
            throw categoryError;
        }

        // 옵션 / SKU 매핑
        const optionRows =
            payload.options.map(
                option => ({
                    product_id:
                        product.product_id,
                    option_name:
                        option.optionName.trim(),
                    option_value:
                        option.optionValue.trim(),
                    surcharge:
                        option.surcharge,
                    sku_id:
                        option.skuId,
                }),
            );

        const {
            error: optionError,
        } = await supabase
            .from('product_options')
            .insert(optionRows);

        if (optionError) {
            throw optionError;
        }

        res.status(201).json({
            success: true,
            data: toCamelCase(product),
            message:
                '상품이 성공적으로 등록되었습니다.',
        });
    } catch (error) {
        console.error(
            'createProduct failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 등록에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 5. 상품 정보 수정
// PUT /api/admin/products/:id
// ==========================================

export const updateProduct = async (
    req: Request<{ id: string }>,
    res: Response,
) => {
    try {
        const { id } = req.params;
        const payload = req.body;

        if (!isUUID(id)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 상품 ID입니다.',
            });
        }

        // 상품 존재 확인
        const {
            data: product,
            error: productError,
        } = await supabase
            .from('products')
            .select('product_id, status, base_price, discount_type, discount_value')
            .eq('product_id', id)
            .single();

        if (productError?.code === 'PGRST116') {
            return res.status(404).json({
                success: false,
                message: '상품을 찾을 수 없습니다.',
            });
        }

        if (productError) {
            throw productError;
        }

        if (product.status === 'DELETED') {
            return res.status(409).json({
                success: false,
                message: '삭제된 상품은 수정할 수 없습니다.',
            });
        }

        // 상품 기본 정보 수정
        const updateData: Record<string, unknown> = {
            ...(payload.productName !== undefined && {
                product_name: payload.productName.trim(),
            }),
            ...(payload.mainImageUrl !== undefined && {
                main_image_url: payload.mainImageUrl,
            }),
            ...(payload.subImageUrls !== undefined && {
                sub_image_urls: payload.subImageUrls,
            }),
            ...(payload.description !== undefined && {
                description: payload.description,
            }),
            ...(payload.status !== undefined && {
                status: payload.status,
            }),
            ...(payload.sortOrder !== undefined && {
                sort_order: payload.sortOrder,
            }),
            ...(payload.basePrice !== undefined && {
                base_price: payload.basePrice,
            }),
            ...(payload.discountType !== undefined && {
                discount_type: payload.discountType,
            }),
            ...(payload.discountValue !== undefined && {
                discount_value: payload.discountValue,
            }),
            ...(payload.discountStartDate !== undefined && {
                discount_start_date: payload.discountStartDate,
            }),
            ...(payload.discountEndDate !== undefined && {
                discount_end_date: payload.discountEndDate,
            }),
        };

        // 가격/할인 변경 시 판매가 재계산
        if (
            payload.basePrice !== undefined ||
            payload.discountType !== undefined ||
            payload.discountValue !== undefined
        ) {
            const basePrice =
                payload.basePrice ?? product.base_price;

            const discountType =
                payload.discountType ?? product.discount_type;

            const discountValue =
                payload.discountValue ?? product.discount_value;

            updateData.discounted_price =
                calculateDiscountedPrice(
                    basePrice,
                    discountType,
                    discountValue,
                );
        }

        const { data: updatedProduct, error: updateError } =
            await supabase
                .from('products')
                .update(updateData)
                .eq('product_id', id)
                .select()
                .single();

        if (updateError) {
            throw updateError;
        }

        // 카테고리 매핑 교체
        if (payload.categoryIds !== undefined) {
            await supabase
                .from('product_categories')
                .delete()
                .eq('product_id', id);

            const { error } = await supabase
                .from('product_categories')
                .insert(
                    payload.categoryIds.map(
                        (categoryId: string) => ({
                            product_id: id,
                            category_id: categoryId,
                        }),
                    ),
                );

            if (error) {
                throw error;
            }
        }

        // 옵션 / SKU 매핑 교체
        if (payload.options !== undefined) {
            await supabase
                .from('product_options')
                .delete()
                .eq('product_id', id);

            const { error } = await supabase
                .from('product_options')
                .insert(
                    payload.options.map((option: ProductOption) => ({
                        product_id: id,
                        option_name: option.optionName,
                        option_value: option.optionValue,
                        surcharge: option.surcharge,
                        sku_id: option.skuId,
                    })),
                );

            if (error) {
                throw error;
            }
        }

        return res.json({
            success: true,
            data: toCamelCase(updatedProduct),
            message: '상품 정보가 수정되었습니다.',
        });
    } catch (error) {
        console.error('updateProduct failed:', error);

        return res.status(500).json({
            success: false,
            message: '상품 정보 수정에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 6. 상품 삭제
// DELETE /api/admin/products/:id
// ==========================================

export const deleteProduct = async (
    req: Request<{ id: string }>,
    res: Response,
) => {
    try {
        const { id } = req.params;

        if (!isUUID(id)) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 상품 ID입니다.',
            });
        }

        const {
            data: product,
            error: selectError,
        } = await supabase
            .from('products')
            .select(
                'product_id, status',
            )
            .eq('product_id', id)
            .single();

        if (selectError) {
            if (
                selectError.code ===
                'PGRST116'
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        '상품을 찾을 수 없습니다.',
                });
            }

            throw selectError;
        }

        if (
            product.status ===
            PRODUCT_STATUS.DELETED
        ) {
            return res.status(409).json({
                success: false,
                message:
                    '이미 삭제된 상품입니다.',
            });
        }

        const {
            error: updateError,
        } = await supabase
            .from('products')
            .update({
                status:
                    PRODUCT_STATUS.DELETED,
            })
            .eq('product_id', id);

        if (updateError) {
            throw updateError;
        }

        res.json({
            success: true,
            message:
                '상품이 삭제되었습니다.',
        });
    } catch (error) {
        console.error(
            'deleteProduct failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 삭제에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 7. 상품 상태 일괄 변경
// PATCH /api/admin/products/batch/status
// ==========================================
export const batchUpdateStatus = async (
    req: Request<{}, {}, ProductStatusPayload>,
    res: Response,
) => {
    try {
        const {
            productIds,
            status,
        } = req.body;

        if (
            !Array.isArray(productIds) ||
            productIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: '변경할 상품을 선택해주세요.',
            });
        }

        if (
            productIds.some(
                id => !isUUID(id),
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 상품 ID가 포함되어 있습니다.',
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from('products')
            .update({
                status,
            })
            .in('product_id', productIds)
            .neq(
                'status',
                PRODUCT_STATUS.DELETED,
            )
            .select('product_id');

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            updatedCount: data?.length ?? 0,
            message:
                `${data?.length ?? 0}개 상품의 상태가 변경되었습니다.`,
        });
    } catch (error) {
        console.error(
            'batchUpdateStatus failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 상태 일괄 변경에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 8. 상품 카테고리 일괄 변경
// PATCH /api/admin/products/batch/category
// ==========================================

export const batchUpdateCategory = async (
    req: Request<
        {},
        {},
        ProductCategoryPayload
    >,
    res: Response,
) => {
    try {
        const {
            productIds,
            categoryIds,
            mode,
        } = req.body;

        if (
            !Array.isArray(productIds) ||
            productIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '변경할 상품을 선택해주세요.',
            });
        }

        if (
            !Array.isArray(categoryIds) ||
            categoryIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '대상 카테고리를 선택해주세요.',
            });
        }

        if (
            productIds.some(
                id => !isUUID(id),
            ) ||
            categoryIds.some(
                id => !isUUID(id),
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 ID가 포함되어 있습니다.',
            });
        }

        if (
            mode !== 'ADD' &&
            mode !== 'REPLACE'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '올바르지 않은 카테고리 변경 방식입니다.',
            });
        }

        // REPLACE
        if (mode === 'REPLACE') {
            const {
                error,
            } = await supabase
                .from('product_categories')
                .delete()
                .in(
                    'product_id',
                    productIds,
                );

            if (error) {
                throw error;
            }
        }

        const rows =
            productIds.flatMap(
                productId =>
                    categoryIds.map(
                        categoryId => ({
                            product_id:
                                productId,
                            category_id:
                                categoryId,
                        }),
                    ),
            );

        const {
            error,
        } = await supabase
            .from('product_categories')
            .upsert(
                rows,
                {
                    onConflict:
                        'product_id,category_id',
                    ignoreDuplicates: true,
                },
            );

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            updatedCount:
                productIds.length,
            message:
                `${productIds.length}개 상품의 카테고리가 변경되었습니다.`,
        });
    } catch (error) {
        console.error(
            'batchUpdateCategory failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 카테고리 일괄 변경에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};

// ==========================================
// 9. 상품 일괄 삭제
// DELETE /api/admin/products/batch
// ==========================================

export const batchDeleteProduct = async (
    req: Request<
        {},
        {},
        ProductDeletePayload
    >,
    res: Response,
) => {
    try {
        const {
            productIds,
        } = req.body;

        if (
            !Array.isArray(productIds) ||
            productIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '삭제할 상품을 선택해주세요.',
            });
        }

        if (
            productIds.some(
                id => !isUUID(id),
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    '유효하지 않은 상품 ID가 포함되어 있습니다.',
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from('products')
            .update({
                status:
                    PRODUCT_STATUS.DELETED,
            })
            .in(
                'product_id',
                productIds,
            )
            .neq(
                'status',
                PRODUCT_STATUS.DELETED,
            )
            .select('product_id');

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            updatedCount:
                data?.length ?? 0,
            message:
                `${data?.length ?? 0}개 상품이 삭제되었습니다.`,
        });
    } catch (error) {
        console.error(
            'batchDeleteProduct failed:',
            error,
        );

        res.status(500).json({
            success: false,
            message:
                '상품 일괄 삭제에 실패했습니다.',
            error: getErrorMessage(error),
        });
    }
};