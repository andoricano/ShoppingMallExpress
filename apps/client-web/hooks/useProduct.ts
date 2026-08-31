// hooks/useProduct.ts

"use client";

import type { Product } from "@mall/types";
import { useCallback, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function useProduct() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/products`;

      console.log("[useProduct] 상품 목록 요청:", url);

      const response = await fetch(url);

      console.log("[useProduct] response:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error("상품 목록을 불러오지 못했습니다.");
      }

      const result = await response.json();

      console.log("[useProduct] API result:", result);
      console.log("[useProduct] API data:", result?.data);
      console.log(
        "[useProduct] data isArray:",
        Array.isArray(result?.data)
      );

      const products = Array.isArray(result?.data)
        ? result.data
        : [];

      console.log("[useProduct] 최종 productList:", products);

      setProductList(products);
    } catch (error) {
      console.error("[useProduct] Fetch display products failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "상품 목록 조회에 실패했습니다."
      );

      setProductList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProduct = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/products/${id}`;

      console.log("[useProduct] 상품 상세 요청:", url);

      const response = await fetch(url);

      console.log(
        "[useProduct] detail response:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error("상품 정보를 불러오지 못했습니다.");
      }

      const result = await response.json();

      console.log("[useProduct] detail result:", result);
      console.log("[useProduct] detail data:", result?.data);

      const productData = result?.data ?? null;

      setProduct(productData);

      return productData as Product | null;
    } catch (error) {
      console.error("[useProduct] Fetch display product failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "상품 조회에 실패했습니다."
      );

      setProduct(null);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    productList,
    product,

    loading,
    error,

    fetchProducts,
    fetchProduct,
  };
}