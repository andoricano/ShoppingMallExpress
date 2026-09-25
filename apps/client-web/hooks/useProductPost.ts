// hooks/useProductPost.ts

"use client";

import { useCallback, useState } from "react";
import type {
  ProductDetail,
  ProductPostDetail,
  ProductPostSummary,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

/**
 * Consumer ProductPost reads through the public Mall v2 RPCs
 * (`list_product_posts`, `get_product_post_detail`). Only published
 * ProductPosts, active Products/Variants and consumer-safe availability are
 * returned; Ware/Warehouse data never reaches this boundary.
 */
export function useProductPost() {
  const [postList, setPostList] =
    useState<ProductPostSummary[]>([]);

  const [post, setPost] =
    useState<ProductPostDetail | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [products, setProducts] =
    useState<ProductDetail[]>([]);

  // ==========================================
  // 1. 상품 게시물 목록 조회
  // ==========================================
  const fetchPosts = useCallback(
    async (options?: {
      categoryId?: string;
      limit?: number;
      offset?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } =
          await createClient().rpc(
            "list_product_posts",
            {
              p_category_id: options?.categoryId ?? null,
              p_limit: options?.limit ?? 100,
              p_offset: options?.offset ?? 0,
            },
          );

        if (rpcError) {
          throw rpcError;
        }

        const posts = Array.isArray(data)
          ? (data as ProductPostSummary[])
          : [];

        setPostList(posts);

        return posts;
      } catch {
        setError(
          "상품 게시물 목록을 불러오지 못했습니다.",
        );
        setPostList([]);

        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ==========================================
  // 2. 상품 게시물 상세 조회
  // ==========================================
  const fetchPost = useCallback(
    async (postId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } =
          await createClient().rpc(
            "get_product_post_detail",
            { p_product_post_id: postId },
          );

        if (rpcError) {
          throw rpcError;
        }

        // null: not found, unpublished, or scheduled for later.
        const postData =
          (data as ProductPostDetail | null) ?? null;

        setPost(postData);
        setProducts(postData?.products ?? []);

        return postData;
      } catch {
        setError(
          "상품 게시물 정보를 불러오지 못했습니다.",
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
  // 3. 상태 초기화
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
