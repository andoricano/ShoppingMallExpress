"use client";

import React, { useState } from "react";
import { InventoryItem, SkuInventory, StockStatus } from "@mall/types";

interface InventoryTableProps {
    items: InventoryItem[];
    isLoading?: boolean;
    onAdjustStock?: (skuId: string, currentQty: number) => void;
    onToggleSkuStatus?: (skuId: string) => void;
}

// 상태별 뱃지 스타일 렌더러
const renderStatusBadge = (status: StockStatus) => {
    const config = {
        IN_STOCK: { label: "정상", bg: "#d3f9d8", color: "#2b8a3e" },
        LOW_STOCK: { label: "재고부족", bg: "#fff3bf", color: "#f59f00" },
        SOLD_OUT: { label: "품절", bg: "#ffe3e3", color: "#f03e3e" },
        DISABLED: { label: "비활성화", bg: "#f1f3f5", color: "#868e96" },
    }[status] || { label: status, bg: "#f1f3f5", color: "#495057" };

    return (
        <span
            style={{
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: config.bg,
                color: config.color,
            }}
        >
            {config.label}
        </span>
    );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
    items,
    isLoading = false,
    onAdjustStock,
    onToggleSkuStatus,
}) => {
    // 상품별 아코디언 펼침 상태 관리 (기본값: 모두 펼침)
    const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

    const toggleExpand = (productId: string) => {
        setExpandedProducts((prev) => ({
            ...prev,
            [productId]: prev[productId] === undefined ? false : !prev[productId],
        }));
    };

    return (
        <div
            style={{
                width: "100%",
                overflowX: "auto",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxSizing: "border-box",
            }}
        >
            <table
                style={{
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "14px",
                }}
            >
                <colgroup>
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                    <tr
                        style={{
                            backgroundColor: "#f8f9fa",
                            borderBottom: "1px solid #dee2e6",
                            color: "#495057",
                        }}
                    >
                        <th style={{ padding: "12px 8px", textAlign: "center" }}></th>
                        <th style={{ padding: "12px 16px" }}>상품명 / ID</th>
                        <th style={{ padding: "12px 16px" }}>카테고리</th>
                        <th style={{ padding: "12px 16px" }}>보유 옵션</th>
                        <th style={{ padding: "12px 16px" }}>총 재고 수량</th>
                        <th style={{ padding: "12px 16px", textAlign: "right" }}>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td
                                colSpan={6}
                                style={{ padding: "60px 16px", textAlign: "center", color: "#6c757d" }}
                            >
                                재고 목록을 불러오는 중입니다...
                            </td>
                        </tr>
                    ) : items.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                style={{ padding: "60px 16px", textAlign: "center", color: "#6c757d" }}
                            >
                                조회된 재고 항목이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const isExpanded = expandedProducts[item.productId] !== false;

                            return (
                                <React.Fragment key={item.productId}>
                                    {/* 1. 상품 메인 행 (Product Row) */}
                                    <tr
                                        style={{
                                            borderBottom: "1px solid #e9ecef",
                                            backgroundColor: "#fafafa",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(item.productId)}
                                                style={{
                                                    border: "none",
                                                    background: "none",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    color: "#495057",
                                                }}
                                            >
                                                {isExpanded ? "▼" : "▶"}
                                            </button>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ color: "#212529" }}>{item.productName}</div>
                                            <div style={{ fontSize: "12px", color: "#868e96", fontWeight: 400 }}>
                                                {item.productId}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#495057", fontWeight: 400 }}>
                                            {item.category || "-"}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontWeight: 400 }}>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {item.skus.map((sku) => (
                                                    <span
                                                        key={sku.skuId}
                                                        style={{
                                                            fontSize: "12px",
                                                            padding: "2px 6px",
                                                            backgroundColor: "#e9ecef",
                                                            borderRadius: "3px",
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        {sku.optionName}: {sku.currentStock}개
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#1c7ed6" }}>
                                            {item.totalStock.toLocaleString()} 개
                                        </td>
                                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                            <span style={{ fontSize: "12px", color: "#868e96", fontWeight: 400 }}>
                                                총 {item.skus.length}개 옵션
                                            </span>
                                        </td>
                                    </tr>

                                    {/* 2. 옵션별 상세 행 (SKU Rows) - 펼침 상태일 때 노출 */}
                                    {isExpanded &&
                                        item.skus.map((sku: SkuInventory) => (
                                            <tr
                                                key={sku.skuId}
                                                style={{
                                                    borderBottom: "1px solid #f1f3f5",
                                                    backgroundColor: "#fff",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                <td></td>
                                                <td style={{ padding: "10px 16px 10px 32px" }}>
                                                    <span style={{ color: "#868e96", marginRight: "8px" }}>└</span>
                                                    <strong style={{ color: "#343a40" }}>
                                                        옵션: {sku.optionName}
                                                    </strong>
                                                    <div style={{ fontSize: "11px", color: "#adb5bd", paddingLeft: "16px" }}>
                                                        SKU: {sku.skuId}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "10px 16px", color: "#868e96" }}>
                                                    안전재고: {sku.safetyStock}개
                                                </td>
                                                <td style={{ padding: "10px 16px" }}>
                                                    {renderStatusBadge(sku.status)}
                                                </td>
                                                <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                                                    {sku.currentStock} 개
                                                </td>
                                                <td style={{ padding: "10px 16px", textAlign: "right" }}>
                                                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                                        {onAdjustStock && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onAdjustStock(sku.skuId, sku.currentStock)}
                                                                style={{
                                                                    padding: "3px 8px",
                                                                    fontSize: "12px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ced4da",
                                                                    backgroundColor: "#fff",
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                수량 조정
                                                            </button>
                                                        )}
                                                        {onToggleSkuStatus && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onToggleSkuStatus(sku.skuId)}
                                                                style={{
                                                                    padding: "3px 8px",
                                                                    fontSize: "12px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ced4da",
                                                                    backgroundColor: sku.status === "DISABLED" ? "#e7f5ff" : "#fff",
                                                                    color: sku.status === "DISABLED" ? "#1c7ed6" : "#495057",
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                {sku.status === "DISABLED" ? "활성화" : "비활성화"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </React.Fragment>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};