"use client";

import React, { useState } from "react";
import { InventoryFilterParams, StockStatus } from "@mall/types";

interface InventorySearchToolbarProps {
    onSearch: (params: InventoryFilterParams) => void;
    onReset?: () => void;
}

export const InventorySearchToolbar: React.FC<InventorySearchToolbarProps> = ({
    onSearch,
    onReset,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState<StockStatus | "">("");

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        onSearch({
            searchQuery: searchQuery.trim() || undefined,
            category: category || undefined,
            status: (status as StockStatus) || undefined,
        });
    };

    const handleReset = () => {
        setSearchQuery("");
        setCategory("");
        setStatus("");
        if (onReset) {
            onReset();
        } else {
            onSearch({});
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                padding: "16px 20px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                marginBottom: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
        >
            <form
                onSubmit={handleSearch}
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                {/* 1. 카테고리 필터 */}
                <div style={{ minWidth: "140px" }}>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #ced4da",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        <option value="">전체 카테고리</option>
                        <option value="SHOES">신발 (SHOES)</option>
                        <option value="CLOTHES">의류 (CLOTHES)</option>
                        <option value="ACC">잡화 (ACC)</option>
                    </select>
                </div>

                {/* 2. 재고 상태 필터 */}
                <div style={{ minWidth: "140px" }}>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StockStatus | "")}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #ced4da",
                            fontSize: "14px",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        <option value="">전체 재고 상태</option>
                        <option value="IN_STOCK">정상 (IN_STOCK)</option>
                        <option value="LOW_STOCK">재고 부족 (LOW_STOCK)</option>
                        <option value="SOLD_OUT">품절 (SOLD_OUT)</option>
                        <option value="DISABLED">비활성화 (DISABLED)</option>
                    </select>
                </div>

                {/* 3. 검색어 입력창 */}
                <div style={{ flex: 1, minWidth: "220px" }}>
                    <input
                        type="text"
                        placeholder="상품명, 상품 ID, SKU ID 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #ced4da",
                            fontSize: "14px",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {/* 4. 액션 버튼 */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="submit"
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#228be6",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: "pointer",
                        }}
                    >
                        검색
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "1px solid #ced4da",
                            backgroundColor: "#fff",
                            color: "#495057",
                            fontSize: "14px",
                            cursor: "pointer",
                        }}
                    >
                        초기화
                    </button>
                </div>
            </form>
        </div>
    );
};