"use client";

import { useCallback } from "react";
import type { ProductPost, ProductPostCategory } from "@mall/types";

type CategoryInput = Partial<Pick<ProductPostCategory, "name" | "slug" | "displayOrder" | "isActive">>;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message ?? "카테고리 요청에 실패했습니다.");
    return result?.data as T;
}

export function usePostCategoryApi() {
    const fetchCategories = useCallback(() => request<ProductPostCategory[]>("/api/admin/categories"), []);
    const createCategory = useCallback((data: CategoryInput) => request<ProductPostCategory>("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }), []);
    const updateCategory = useCallback((id: string, data: CategoryInput) => request<ProductPostCategory>(`/api/admin/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }), []);
    const deleteCategory = useCallback((id: string) => request<ProductPostCategory>(`/api/admin/categories/${id}`, { method: "DELETE" }), []);
    const fetchPostsByCategory = useCallback((id: string) => request<Pick<ProductPost, "id">[]>(`/api/admin/categories/${id}/posts`), []);
    const addPostsToCategory = useCallback((id: string, postIds: string[]) => request<void>(`/api/admin/categories/${id}/posts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postIds }) }), []);
    const removePostFromCategory = useCallback((id: string, postId: string) => request<void>(`/api/admin/categories/${id}/posts/${postId}`, { method: "DELETE" }), []);
    return { fetchCategories, createCategory, updateCategory, deleteCategory, fetchPostsByCategory, addPostsToCategory, removePostFromCategory };
}
