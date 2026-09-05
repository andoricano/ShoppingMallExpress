// hooks/useProductPost.tsx

"use client";

import { useCallback, useState } from "react";
import type {
  Product,
  ProductPost,
} from "@mall/types";
import { API_ENDPOINTS } from "@mall/constants";


interface ProductPostDetailResponse
  extends ProductPost {
  productPostProducts: {
    id: string;
    productId: string;
    displayOrder: number;
    products: Product;
  }[];
}


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export function useProductPost() {
  const [postList, setPostList] =
    useState<ProductPost[]>([]);

  const [post, setPost] =
    useState<ProductPost | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);


  // ==========================================
  // 1. Client 상품 게시물 목록 조회
  // ==========================================
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url =
        `${API_BASE_URL}${API_ENDPOINTS.CLIENT_PRODUCT_POSTS.BASE}`;

      console.log(
        "[useProductPost] 상품 게시물 목록 요청:",
        url,
      );

      const response = await fetch(url);

      console.log(
        "[useProductPost] response:",
        response.status,
        response.statusText,
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "상품 게시물 목록을 불러오지 못했습니다.",
        );
      }

      const posts = Array.isArray(result?.data)
        ? result.data
        : [];

      console.log(
        "[useProductPost] API result:",
        result,
      );

      setPostList(posts);

      return posts as ProductPost[];
    } catch (err) {
      console.error(
        "[useProductPost] 상품 게시물 목록 조회 실패:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "상품 게시물 목록 조회에 실패했습니다.",
      );

      setPostList([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // 2. Client 상품 게시물 상세 조회
  // ==========================================

  const fetchPost = useCallback(
    async (postId: string) => {
      setLoading(true);
      setError(null);

      try {
        const url =
          `${API_BASE_URL}${API_ENDPOINTS.CLIENT_PRODUCT_POSTS.BY_ID(postId)}`;

        console.log(
          "[useProductPost] 상품 게시물 상세 요청:",
          url,
        );

        const response = await fetch(url);

        console.log(
          "[useProductPost] detail response:",
          response.status,
          response.statusText,
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "상품 게시물 정보를 불러오지 못했습니다.",
          );
        }


        const postData =
          result?.data as
          | ProductPostDetailResponse
          | null;

        if (!postData) {
          setPost(null);
          setProducts([]);

          return null;
        }

        const productList = [
          ...(postData.productPostProducts ?? []),
        ]
          .sort(
            (a, b) =>
              a.displayOrder -
              b.displayOrder,
          )
          .map(
            (item) => item.products,
          );

        setPost(postData);
        setProducts(productList);

        return postData as ProductPost;


      } catch (err) {


        console.error(
          "[useProductPost] 상품 게시물 상세 조회 실패:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "상품 게시물 조회에 실패했습니다.",
        );

        setPost(null);
        setProducts([]);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ==========================================
  // 3. Post 상태 초기화
  // ==========================================

  const clearPost = useCallback(() => {
    setPost(null);
    setProducts([]);
  }, []);

  const clearPosts = useCallback(() => {
    setPostList([]);
  }, []);

  return {
    postList,
    post,
    products,

    loading,
    error,

    fetchPosts,
    fetchPost,

    clearPost,
    clearPosts,
  };
}