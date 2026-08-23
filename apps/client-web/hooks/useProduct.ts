"use client";

import type { Product, ClientProductFilterParams } from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface PaginationInfo {
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// 💡 백엔드의 snake_case 데이터를 프론트엔드 Product 타입(camelCase, nested price)으로 변환하는 함수
function mapBackendProductToProduct(raw: any): Product {
  if (!raw) return raw;

  return {
    productId: raw.product_id || raw.productId || "",
    productName: raw.product_name || raw.productName || "이름 없는 상품",
    mainImageUrl: raw.main_image_url || raw.mainImageUrl || "",
    subImageUrls: raw.sub_image_urls || raw.subImageUrls || [],
    description: raw.description || "",
    status: raw.status || "DISPLAY",
    sortOrder: raw.sort_order ?? raw.sortOrder ?? 0,

    // 평탄화되어 오는 가격 정보를 price 객체 구조로 묶음
    price: {
      basePrice: Number(raw.base_price ?? raw.price?.basePrice ?? 0),
      discountedPrice: Number(
        raw.discounted_price ?? raw.price?.discountedPrice ?? 0
      ),
      discountType: raw.discount_type || raw.price?.discountType,
      discountValue: raw.discount_value
        ? Number(raw.discount_value)
        : raw.price?.discountValue,
      discountStartDate: raw.discount_start_date || raw.price?.discountStartDate,
      discountEndDate: raw.discount_end_date || raw.price?.discountEndDate,
    },

    options: Array.isArray(raw.options)
      ? raw.options.map((opt: any) => ({
          optionId: opt.option_id || opt.optionId,
          optionName: opt.option_name || opt.optionName,
          optionValue: opt.option_value || opt.optionValue,
          surcharge: Number(opt.surcharge || 0),
          skuId: opt.sku_id || opt.skuId,
        }))
      : [],

    categoryIds: Array.isArray(raw.categories)
      ? raw.categories.map((c: any) => c.category_id || c.categoryId || c)
      : raw.categoryIds || [],

    createdAt: raw.created_at || raw.createdAt || "",
    updatedAt: raw.updated_at || raw.updatedAt || "",
  };
}

export function useProduct() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // [1] 상품 목록 조회
  const fetchProducts = useCallback(async (params?: ClientProductFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params?.categoryId) queryParams.append("categoryId", params.categoryId);
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.page) queryParams.append("page", String(params.page));
      if (params?.limit) queryParams.append("limit", String(params.limit));

      const requestUrl = `${API_BASE_URL}/api/products/client?${queryParams.toString()}`;
      const response = await fetch(requestUrl).catch(() => null);

      if (!response || !response.ok) {
        setError("상품 목록을 불러오지 못했습니다.");
        setProductList([]);
        return;
      }

      const responseData = await response.json();
      let rawList: any[] = [];

      if (Array.isArray(responseData)) {
        rawList = responseData;
      } else if (Array.isArray(responseData.data)) {
        rawList = responseData.data;
        if (responseData.pagination) {
          setPagination(responseData.pagination);
        }
      }

      // 💡 매핑 함수를 통해 타입 규칙에 맞게 데이터를 가공
      const formattedList = rawList.map(mapBackendProductToProduct);
      setProductList(formattedList);
    } catch (err: any) {
      console.error("❌ [useProduct] fetchProducts 예외 발생:", err);
      setError("상품 목록을 불러오는 중 오류가 발생했습니다.");
      setProductList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // [2] 상품 상세 조회
  const fetchProductById = useCallback(async (productId: string) => {
    if (!productId) return null;

    setLoading(true);
    setError(null);
    try {
      const requestUrl = `${API_BASE_URL}/api/products/${productId}`;
      const response = await fetch(requestUrl).catch(() => null);

      if (!response || !response.ok) {
        setError("상품 정보를 불러오는데 실패했습니다.");
        setSelectedProduct(null);
        return null;
      }

      const responseData = await response.json();
      const rawProduct = responseData.data || responseData;

      // 💡 매핑 함수로 데이터 가공
      const formattedProduct = mapBackendProductToProduct(rawProduct);

      setSelectedProduct(formattedProduct);
      return formattedProduct;
    } catch (err: any) {
      console.error("❌ [useProduct] fetchProductById 예외 발생:", err);
      setError("상품 상세 정보를 불러오는 중 오류가 발생했습니다.");
      setSelectedProduct(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    productList,
    selectedProduct,
    pagination,
    loading,
    error,
    fetchProducts,
    fetchProductById,
  };
}