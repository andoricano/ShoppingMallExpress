"use client";

import { useAdminAuthStore } from "@/store/useAdminAuth";
import type {
    AdminProductFilterParams,
    CreateProductPayload,
    Product,
    ProductStatus,
    UpdateProductPayload,
} from "@mall/types";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 페이지네이션 응답 타입 정의
interface PaginationInfo {
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

export function useProductAdmin() {
    const { user } = useAdminAuthStore();

    const isAdmin = user?.role === "ADMIN";
    const currentAdminId = user?.id || "SYSTEM_ADMIN";

    // 서버 데이터를 담을 상태
    const [productList, setProductList] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // [1] 어드민 상품 목록 서버 조회 (GET /api/products/admin)
    // - 필터링(검색어, 상태, 카테고리) 및 페이징 지원
    const fetchAdminProducts = useCallback(async (params?: AdminProductFilterParams) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (params?.searchQuery) queryParams.append("searchQuery", params.searchQuery);
            if (params?.status) queryParams.append("status", params.status);
            if (params?.categoryId) queryParams.append("categoryId", params.categoryId);
            if (params?.page) queryParams.append("page", String(params.page));
            if (params?.limit) queryParams.append("limit", String(params.limit));

            const response = await fetch(`${API_BASE_URL}/api/products/admin?${queryParams.toString()}`);
            if (!response.ok) throw new Error("상품 목록을 불러오는데 실패했습니다.");

            const responseData = await response.json();

            // 백엔드 응답 형태 검증 ({ success: true, data: [...], pagination: {...} })
            if (Array.isArray(responseData)) {
                setProductList(responseData);
            } else if (Array.isArray(responseData.data)) {
                setProductList(responseData.data);
                if (responseData.pagination) {
                    setPagination(responseData.pagination);
                }
            } else {
                console.error("[useProductAdmin] 백엔드 응답이 배열 형식이 아닙니다:", responseData);
                setProductList([]); // .map 에러 방지용 안전장치
            }
        } catch (err: any) {
            console.error("[useProductAdmin] fetchAdminProducts 오류:", err);
            setError(err.message || "서버 통신 오류");
            setProductList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // [2] 상품 신규 등록 (POST /api/products)
    // - Inventory 모듈의 SKU와 연동된 옵션 정보 전달
    const createProduct = async (payload: CreateProductPayload) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("상품 등록에 실패했습니다.");

            await fetchAdminProducts(); // 등록 성공 시 최신 목록 재조회
            return true;
        } catch (err: any) {
            console.error("[useProductAdmin] createProduct 오류:", err);
            alert(err.message || "상품 등록 중 오류가 발생했습니다.");
            return false;
        }
    };

    // [3] 상품 정보 수정 (PATCH /api/products/:id)
    const updateProduct = async (productId: string, payload: UpdateProductPayload) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("상품 수정에 실패했습니다.");

            await fetchAdminProducts(); // 수정 성공 시 최신 목록 재조회
            return true;
        } catch (err: any) {
            console.error("[useProductAdmin] updateProduct 오류:", err);
            alert(err.message || "상품 수정 중 오류가 발생했습니다.");
            return false;
        }
    };

    // [4] 상품 삭제 (DELETE /api/products/:id)
    // - DB 물리 삭제가 아닌 DELETED 상태로 Soft Delete 처리
    const deleteProduct = async (productId: string) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return false;
        }

        if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("상품 삭제 처리에 실패했습니다.");

            await fetchAdminProducts(); // 삭제 처리 후 목록 재조회
            return true;
        } catch (err: any) {
            console.error("[useProductAdmin] deleteProduct 오류:", err);
            alert(err.message || "상품 삭제 중 오류가 발생했습니다.");
            return false;
        }
    };

    // [5] 진열 상태 일괄 변경 (PATCH /api/products/admin/batch-status)
    // - 체크박스로 다중 선택된 상품들의 진열 상태(DISPLAY ↔ HIDDEN) 일괄 전환
    const batchUpdateStatus = async (
        productIds: string[],
        status: Extract<ProductStatus, "DISPLAY" | "HIDDEN">
    ) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return false;
        }

        if (productIds.length === 0) {
            alert("선택된 상품이 없습니다.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/admin/batch-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productIds, status }),
            });

            if (!response.ok) throw new Error("진열 상태 일괄 변경에 실패했습니다.");

            await fetchAdminProducts();
            return true;
        } catch (err: any) {
            console.error("[useProductAdmin] batchUpdateStatus 오류:", err);
            alert(err.message || "진열 상태 변경 중 오류가 발생했습니다.");
            return false;
        }
    };

    // [6] 카테고리 일괄 이동 (PATCH /api/products/admin/batch-category)
    // - 선택한 상품들의 카테고리를 타겟 카테고리로 일괄 변경
    const batchUpdateCategory = async (productIds: string[], targetCategoryIds: string[]) => {
        if (!isAdmin) {
            alert("관리자 권한이 필요합니다.");
            return false;
        }

        if (productIds.length === 0) {
            alert("선택된 상품이 없습니다.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/admin/batch-category`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productIds, targetCategoryIds }),
            });

            if (!response.ok) throw new Error("카테고리 일괄 이동에 실패했습니다.");

            await fetchAdminProducts();
            return true;
        } catch (err: any) {
            console.error("[useProductAdmin] batchUpdateCategory 오류:", err);
            alert(err.message || "카테고리 이동 중 오류가 발생했습니다.");
            return false;
        }
    };

    // 마운트 시 초기 목록 로드
    useEffect(() => {
        fetchAdminProducts();
    }, [fetchAdminProducts]);

    return {
        isAdmin,
        currentAdminId,
        productList,
        pagination,
        loading,
        error,
        fetchAdminProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        batchUpdateStatus,
        batchUpdateCategory,
    };
}