// @/components/product/useProductCategory.ts
"use client";

import type { ProductCategory } from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 주석: 平 (Flat) 배열을 parentId 기준으로 계층형 트리(Tree) 데이터로 변환하는 함수
const buildCategoryTree = (flatList: any[]): ProductCategory[] => {
    const categoryMap = new Map<string, ProductCategory>();
    const tree: ProductCategory[] = [];

    // 1차 패스: 모든 객체를 camelCase 규격으로 1차 변환 및 Map에 저장
    flatList.forEach((item) => {
        const categoryId = item.categoryId || item.category_id || item.idx?.toString();
        const node: ProductCategory = {
            ...item,
            categoryId,
            categoryName: item.categoryName || item.category_name,
            parentId: item.parentId ?? item.parent_id ?? null,
            depth: item.depth,
            displayOrder: item.displayOrder ?? item.display_order ?? 0,
            createdAt: item.createdAt || item.created_at,
            updatedAt: item.updatedAt || item.updated_at,
            children: [],
        };
        if (categoryId) {
            categoryMap.set(categoryId, node);
        }
    });

    // 2차 패스: parentId 관계를 조회하여 부모의 children 배열에 자식 노드 삽입
    categoryMap.forEach((node) => {
        if (node.parentId && categoryMap.has(node.parentId)) {
            // 부모 노드가 존재하면 부모의 children 배열로 들어감 주석: 트리 구조 형성
            categoryMap.get(node.parentId)!.children!.push(node);
        } else {
            // 최상위 노드(Depth 1)인 경우 결과 트리의 루트 항목으로 추가 주석: 최상위 노드
            tree.push(node);
        }
    });

    return tree;
};

export function useProductCategory() {
    const [categoryList, setCategoryList] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 카테고리 전체 계층 목록 조회 (GET /api/categories)
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                console.error(`[useProductCategory] GET /api/categories 호출 실패 - Status: ${response.status}`);
                throw new Error(`카테고리 목록을 불러오는 데 실패했습니다. (Status: ${response.status})`);
            }

            const responseData = await response.json();

            let rawData: any[] = [];
            if (Array.isArray(responseData)) {
                rawData = responseData;
            } else if (Array.isArray(responseData?.data)) {
                rawData = responseData.data;
            }

            // 주석: 平 배열 데이터를 트리 구조로 변환하여 상태 할당
            const structuredTree = buildCategoryTree(rawData);
            setCategoryList(structuredTree);
        } catch (err: any) {
            console.error("[useProductCategory] fetchCategories 오류:", err.message || err);
            setError(err.message || "알 수 없는 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    // [2] 신규 카테고리 생성 (POST /api/categories/admin)
    const createCategory = async (
        payload: Omit<ProductCategory, "categoryId">
    ): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories/admin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error(`[useProductCategory] POST /api/categories/admin 호출 실패 - Status: ${response.status}`);
                throw new Error("카테고리 생성에 실패했습니다.");
            }

            await fetchCategories();
            return true;
        } catch (err: any) {
            console.error("[useProductCategory] createCategory 오류:", err.message || err);
            alert(err.message || "카테고리 생성 중 오류가 발생했습니다.");
            return false;
        }
    };

    // [3] 카테고리 정보 수정 (PATCH /api/categories/admin/:categoryId)
    const updateCategory = async (
        categoryId: string,
        payload: Partial<ProductCategory>
    ): Promise<boolean> => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/categories/admin/${categoryId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                console.error(`[useProductCategory] PATCH /api/categories/admin/${categoryId} 호출 실패 - Status: ${response.status}`);
                throw new Error("카테고리 수정에 실패했습니다.");
            }

            await fetchCategories();
            return true;
        } catch (err: any) {
            console.error("[useProductCategory] updateCategory 오류:", err.message || err);
            alert(err.message || "카테고리 수정 중 오류가 발생했습니다.");
            return false;
        }
    };

    // [4] 카테고리 삭제 (DELETE /api/categories/admin/:categoryId)
    const deleteCategory = async (categoryId: string): Promise<boolean> => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/categories/admin/${categoryId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                console.error(`[useProductCategory] DELETE /api/categories/admin/${categoryId} 호출 실패 - Status: ${response.status}`);
                throw new Error("카테고리 삭제에 실패했습니다.");
            }

            await fetchCategories();
            return true;
        } catch (err: any) {
            console.error("[useProductCategory] deleteCategory 오류:", err.message || err);
            alert(err.message || "카테고리 삭제 중 오류가 발생했습니다.");
            return false;
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categoryList,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}