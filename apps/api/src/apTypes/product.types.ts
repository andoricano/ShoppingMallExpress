import type { ProductStatus, DiscountType } from '@mall/types';

// 1. DTO: 옵션 등록 Request
export interface ProductOptionInput {
  optionName: string;
  optionValue: string;
  surcharge?: number;
  skuId: string; // 원천 재고 sku_inventories.id
}

// 2. DTO: 상품 생성 Request Body
export interface CreateProductPayload {
  productName: string;
  mainImageUrl: string;
  subImageUrls?: string[];
  description?: string;
  status?: ProductStatus;
  sortOrder?: number;
  basePrice: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  categoryIds: string[];
  options: ProductOptionInput[];
}

// 3. DTO: HTTP Query Parameters (문자열 타입 처리)
export interface ProductQueryParams {
  page?: string;
  limit?: string;
  categoryId?: string;
  status?: ProductStatus;
  searchQuery?: string;
  sortBy?: 'created_at' | 'discounted_price' | 'sort_order';
  sortOrder?: 'asc' | 'desc';
}