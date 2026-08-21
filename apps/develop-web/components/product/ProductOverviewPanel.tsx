// @/components/product/ProductOverviewPanel.tsx
"use client";

import { AdminProductFilterParams, Product, ProductCategory, ProductStatus } from "@mall/types";
import { useState } from "react";

// 상품 상태 표시 배지 컴포넌트
function StatusBadge({ status }: { status: ProductStatus }) {
    const statusStyles: Record<ProductStatus, string> = {
        DISPLAY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        HIDDEN: "bg-zinc-800 text-zinc-400 border-zinc-700",
        SOLD_OUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        DELETED: "bg-rose-500/10 text-rose-400 border-rose-500/20 line-through",
    };

    const statusLabels: Record<ProductStatus, string> = {
        DISPLAY: "진열중",
        HIDDEN: "숨김",
        SOLD_OUT: "품절",
        DELETED: "삭제됨",
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-medium rounded border ${
                statusStyles[status] || "bg-zinc-800 text-zinc-400"
            }`}
        >
            {statusLabels[status] || status}
        </span>
    );
}

interface PaginationInfo {
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

interface ProductOverviewPanelProps {
    productList: Product[];
    pagination?: PaginationInfo;
    categoryList?: ProductCategory[]; // 일괄 카테고리 이동용 카테고리 목록
    loading?: boolean;
    onFetchProducts: (params?: AdminProductFilterParams) => void;
    onDeleteProduct: (productId: string) => void;
    onBatchUpdateStatus: (
        productIds: string[],
        status: Extract<ProductStatus, "DISPLAY" | "HIDDEN">
    ) => Promise<boolean>;
    onBatchUpdateCategory: (
        productIds: string[],
        targetCategoryIds: string[]
    ) => Promise<boolean>;
    onEditProduct?: (product: Product) => void; // 수정 모달/폼 연결용 (선택)
}

export function ProductOverviewPanel({
    productList,
    pagination,
    categoryList = [],
    loading = false,
    onFetchProducts,
    onDeleteProduct,
    onBatchUpdateStatus,
    onBatchUpdateCategory,
    onEditProduct,
}: ProductOverviewPanelProps) {
    // 1. 검색 및 필터 상태
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

    // 2. 다중 선택된 상품 ID 상태
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    // 3. 일괄 카테고리 이동 대상 선택 상태
    const [targetCategoryId, setTargetCategoryId] = useState<string>("");

    // 검색 실행 처리
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onFetchProducts({
            searchQuery: searchQuery.trim() || undefined,
            status: statusFilter === "ALL" ? undefined : statusFilter,
            categoryId: categoryFilter === "ALL" ? undefined : categoryFilter,
            page: 1,
        });
    };

    // 필터 초기화
    const handleResetFilter = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setCategoryFilter("ALL");
        onFetchProducts({ page: 1 });
    };

    // 전체 체크박스 토글
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProductIds(productList.map((p) => p.productId));
        } else {
            setSelectedProductIds([]);
        }
    };

    // 개별 체크박스 토글
    const handleSelectOne = (productId: string, checked: boolean) => {
        if (checked) {
            setSelectedProductIds((prev) => [...prev, productId]);
        } else {
            setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
        }
    };

    // 일괄 상태 변경 실행 (DISPLAY 또는 HIDDEN)
    const handleBatchStatus = async (status: Extract<ProductStatus, "DISPLAY" | "HIDDEN">) => {
        if (selectedProductIds.length === 0) return;
        const success = await onBatchUpdateStatus(selectedProductIds, status);
        if (success) {
            setSelectedProductIds([]); // 성공 시 선택 해제
        }
    };

    // 일괄 카테고리 이동 실행
    const handleBatchCategory = async () => {
        if (selectedProductIds.length === 0) {
            alert("선택된 상품이 없습니다.");
            return;
        }
        if (!targetCategoryId) {
            alert("이동할 카테고리를 선택해주세요.");
            return;
        }
        const success = await onBatchUpdateCategory(selectedProductIds, [targetCategoryId]);
        if (success) {
            setSelectedProductIds([]);
            setTargetCategoryId("");
        }
    };

    const isAllSelected =
        productList.length > 0 && selectedProductIds.length === productList.length;

    return (
        <div className="flex flex-col gap-4">
            {/* 1. 상단 검색 및 필터 바 */}
            <form
                onSubmit={handleSearch}
                className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-wrap gap-3 items-center justify-between"
            >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* 검색어 입력 */}
                    <input
                        type="text"
                        placeholder="상품명 또는 상품 ID 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white min-w-[200px] focus:outline-none focus:border-blue-500"
                    />

                    {/* 진열 상태 필터 */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "ALL")}
                        className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                    >
                        <option value="ALL">전체 상태</option>
                        <option value="DISPLAY">진열중 (DISPLAY)</option>
                        <option value="HIDDEN">숨김 (HIDDEN)</option>
                        <option value="SOLD_OUT">품절 (SOLD_OUT)</option>
                        <option value="DELETED">삭제됨 (DELETED)</option>
                    </select>

                    {/* 카테고리 필터 */}
                    {categoryList.length > 0 && (
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                        >
                            <option value="ALL">전체 카테고리</option>
                            {categoryList.map((cat) => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        type="submit"
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded"
                    >
                        검색
                    </button>
                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded"
                    >
                        초기화
                    </button>
                </div>

                <div className="text-xs text-zinc-400">
                    총 <strong className="text-white">{pagination?.totalCount ?? productList.length}</strong>개 상품
                </div>
            </form>

            {/* 2. 일괄 처리 컨트롤 바 (선택된 항목이 있을 때 강조) */}
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                        선택된 상품: <strong className="text-blue-400">{selectedProductIds.length}</strong>개
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* 일괄 상태 변경 */}
                    <button
                        type="button"
                        onClick={() => handleBatchStatus("DISPLAY")}
                        disabled={selectedProductIds.length === 0}
                        className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        진열중으로 변경
                    </button>
                    <button
                        type="button"
                        onClick={() => handleBatchStatus("HIDDEN")}
                        disabled={selectedProductIds.length === 0}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        숨김으로 변경
                    </button>

                    {/* 일괄 카테고리 이동 */}
                    {categoryList.length > 0 && (
                        <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
                            <select
                                value={targetCategoryId}
                                onChange={(e) => setTargetCategoryId(e.target.value)}
                                disabled={selectedProductIds.length === 0}
                                className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-white disabled:opacity-40"
                            >
                                <option value="">이동할 카테고리 선택</option>
                                {categoryList.map((cat) => (
                                    <option key={cat.categoryId} value={cat.categoryId}>
                                        {cat.categoryName}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleBatchCategory}
                                disabled={selectedProductIds.length === 0 || !targetCategoryId}
                                className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                카테고리 이동
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. 상품 목록 테이블 */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300 min-w-[800px]">
                    <thead className="bg-zinc-800/80 text-zinc-400 uppercase border-b border-zinc-700">
                        <tr>
                            <th className="p-2.5 w-10">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="rounded bg-zinc-700 border-zinc-600"
                                />
                            </th>
                            <th className="p-2.5 w-16">이미지</th>
                            <th className="p-2.5">상품 정보 (ID / 상품명)</th>
                            <th className="p-2.5">정상가 / 판매가</th>
                            <th className="p-2.5">옵션 수 (매핑 SKU)</th>
                            <th className="p-2.5">우선순위</th>
                            <th className="p-2.5">상태</th>
                            <th className="p-2.5 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-zinc-500">
                                    상품 목록을 불러오는 중입니다...
                                </td>
                            </tr>
                        ) : productList.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-zinc-500">
                                    등록된 상품이 없거나 검색 결과가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            productList.map((product) => {
                                const isSelected = selectedProductIds.includes(product.productId);
                                const hasDiscount =
                                    product.price.discountedPrice < product.price.basePrice;

                                return (
                                    <tr
                                        key={product.productId}
                                        className={`hover:bg-zinc-800/40 transition-colors ${
                                            isSelected ? "bg-blue-950/20" : ""
                                        }`}
                                    >
                                        {/* 선택 체크박스 */}
                                        <td className="p-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) =>
                                                    handleSelectOne(
                                                        product.productId,
                                                        e.target.checked
                                                    )
                                                }
                                                className="rounded bg-zinc-700 border-zinc-600"
                                            />
                                        </td>

                                        {/* 메인 썸네일 */}
                                        <td className="p-2.5">
                                            {product.mainImageUrl ? (
                                                <img
                                                    src={product.mainImageUrl}
                                                    alt={product.productName}
                                                    className="w-10 h-10 object-cover rounded bg-zinc-800 border border-zinc-700"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">
                                                    No Img
                                                </div>
                                            )}
                                        </td>

                                        {/* 상품명 및 ID */}
                                        <td className="p-2.5">
                                            <div className="font-medium text-white">
                                                {product.productName}
                                            </div>
                                            <div className="font-mono text-[11px] text-zinc-500">
                                                {product.productId}
                                            </div>
                                        </td>

                                        {/* 가격 및 할인 정보 */}
                                        <td className="p-2.5">
                                            {hasDiscount ? (
                                                <div>
                                                    <span className="text-zinc-500 line-through mr-1.5">
                                                        {product.price.basePrice.toLocaleString()}원
                                                    </span>
                                                    <span className="font-semibold text-rose-400">
                                                        {product.price.discountedPrice.toLocaleString()}원
                                                    </span>
                                                    {product.price.discountValue && (
                                                        <span className="ml-1 text-[10px] px-1 bg-rose-500/10 text-rose-400 rounded">
                                                            {product.price.discountType === "PERCENTAGE"
                                                                ? `${product.price.discountValue}%`
                                                                : `-${product.price.discountValue.toLocaleString()}원`}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="font-medium text-zinc-200">
                                                    {product.price.basePrice.toLocaleString()}원
                                                </span>
                                            )}
                                        </td>

                                        {/* 옵션 매핑 정보 */}
                                        <td className="p-2.5">
                                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]">
                                                {product.options?.length || 0}개 옵션
                                            </span>
                                        </td>

                                        {/* 우선순위 */}
                                        <td className="p-2.5 text-zinc-400 font-mono">
                                            {product.sortOrder ?? 0}
                                        </td>

                                        {/* 상태 배지 */}
                                        <td className="p-2.5">
                                            <StatusBadge status={product.status} />
                                        </td>

                                        {/* 액션 버튼 */}
                                        <td className="p-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {onEditProduct && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditProduct(product)}
                                                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px]"
                                                    >
                                                        수정
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteProduct(product.productId)}
                                                    className="px-2 py-1 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/40 rounded text-[11px]"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}