"use client";
import { useCallback, useState } from "react";
import type { ProductPost } from "@mall/types";

interface ProductPostQuery { search?: string; status?: ProductPost["status"] }
export function useAdminPostProducts() {
    const [postList, setPostList] = useState<ProductPost[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
    const fetchPosts = useCallback(async (params?: ProductPostQuery) => { setLoading(true); setError(null); try { const query = new URLSearchParams(); if (params?.search) query.set("search", params.search); if (params?.status) query.set("status", params.status); const response = await fetch(`/api/admin/product-posts?${query}`); const result = await response.json(); if (!response.ok) throw new Error(result?.message ?? "상품 게시물 목록 조회에 실패했습니다."); setPostList(Array.isArray(result?.data) ? result.data : []); } catch (cause) { setError(cause instanceof Error ? cause.message : "상품 게시물 목록 조회에 실패했습니다."); } finally { setLoading(false); } }, []);
    const fetchCategoryPosts = useCallback(async (categoryId: string) => { await fetchPosts({ search: categoryId }); }, [fetchPosts]);
    const deletePost = useCallback(async (postId: string) => { const response = await fetch(`/api/admin/product-posts/${postId}`, { method: "DELETE" }); if (!response.ok) throw new Error("상품 게시물 삭제에 실패했습니다."); }, []);
    return { postList, loading, error, fetchPosts, fetchCategoryPosts, deletePost };
}
