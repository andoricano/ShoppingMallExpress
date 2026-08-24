"use client";

import React, { useState } from "react";
import { useAdminInventory } from "@/hooks/useAdminInventory";
import { AdjustmentReason } from "@mall/types";
import { InventorySearchToolbar } from "@/component/inventory/InventorySearchToolbar";
import { InventoryTable } from "@/component/inventory/InventoryTable";
import { AddInventoryModal } from "@/component/inventory/AddInventoryModal";

export default function AdminInventoryPage() {
    const {
        inventoryList,
        logs,
        loading,
        error,
        fetchInventoryList,
        createProductInventory,
        adjustStock,
        toggleSkuStatus,
    } = useAdminInventory();

    // UI 상태 관리
    const [activeTab, setActiveTab] = useState<"inventory" | "logs">("inventory");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // 수동 재고 조정 모달용 상태
    const [adjustTargetSku, setAdjustTargetSku] = useState<{ skuId: string; currentQty: number } | null>(null);
    const [adjustQty, setAdjustQty] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState<AdjustmentReason>("AUDIT");
    const [adjustMemo, setAdjustMemo] = useState("");

    // 수동 재고 조정 제출
    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustTargetSku) return;

        try {
            await adjustStock(
                adjustTargetSku.skuId,
                adjustQty,
                adjustReason,
                adjustMemo,
            );
            alert("재고가 성공적으로 조정되었습니다.");
            setAdjustTargetSku(null);
            setAdjustQty(0);
            setAdjustMemo("");
        } catch (err: any) {
            alert(err.message || "재고 조정 중 오류가 발생했습니다.");
        }
    };

    return (
        <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto", fontFamily: "sans-serif" }}>
            {/* 1. 상단 타이틀 및 등록 버튼 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0", color: "#212529" }}>
                        재고 관리 (Admin)
                    </h1>
                    <p style={{ margin: 0, color: "#6c757d", fontSize: "14px" }}>
                        상품별 사이즈/옵션(SKU) 재고를 조회하고 수동 조정 및 신규 등록을 수행합니다.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    style={{
                        padding: "10px 18px",
                        borderRadius: "6px",
                        backgroundColor: "#1c7ed6",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                    }}
                >
                    + 신규 재고 등록
                </button>
            </div>

            {/* 2. 탭 메인 메뉴 (재고 현황 / 감사 로그) */}
            <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e9ecef", marginBottom: "20px" }}>
                <button
                    onClick={() => setActiveTab("inventory")}
                    style={{
                        padding: "10px 16px",
                        border: "none",
                        background: "none",
                        fontSize: "15px",
                        fontWeight: activeTab === "inventory" ? 700 : 500,
                        color: activeTab === "inventory" ? "#1c7ed6" : "#495057",
                        borderBottom: activeTab === "inventory" ? "2px solid #1c7ed6" : "none",
                        marginBottom: "-2px",
                        cursor: "pointer",
                    }}
                >
                    재고 현황 목록
                </button>
                <button
                    onClick={() => setActiveTab("logs")}
                    style={{
                        padding: "10px 16px",
                        border: "none",
                        background: "none",
                        fontSize: "15px",
                        fontWeight: activeTab === "logs" ? 700 : 500,
                        color: activeTab === "logs" ? "#1c7ed6" : "#495057",
                        borderBottom: activeTab === "logs" ? "2px solid #1c7ed6" : "none",
                        marginBottom: "-2px",
                        cursor: "pointer",
                    }}
                >
                    감사 로그 (Audit Log)
                </button>
            </div>

            {error && (
                <div style={{ padding: "12px 16px", backgroundColor: "#ffe3e3", color: "#e03131", borderRadius: "6px", marginBottom: "16px" }}>
                    {error}
                </div>
            )}

            {/* 3. 탭별 콘텐츠 */}
            {activeTab === "inventory" ? (
                <>
                    {/* 검색 및 필터 툴바 */}
                    <InventorySearchToolbar
                        onSearch={(params) => fetchInventoryList(params)}
                        onReset={() => fetchInventoryList()}
                    />

                    {/* 재고 목록 테이블 */}
                    <InventoryTable
                        items={inventoryList}
                        isLoading={loading}
                        onAdjustStock={(skuId, currentQty) => setAdjustTargetSku({ skuId, currentQty })}
                        onToggleSkuStatus={toggleSkuStatus}
                    />
                </>
            ) : (
                /* 감사 로그 간단 테이블 */
                <div style={{ border: "1px solid #e9ecef", borderRadius: "8px", backgroundColor: "#fff", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                <th style={{ padding: "12px 16px" }}>일시</th>
                                <th style={{ padding: "12px 16px" }}>SKU ID (옵션)</th>
                                <th style={{ padding: "12px 16px" }}>변동 수량</th>
                                <th style={{ padding: "12px 16px" }}>사유 유형</th>
                                <th style={{ padding: "12px 16px" }}>메모</th>
                                <th style={{ padding: "12px 16px" }}>담당자</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#868e96" }}>
                                        기록된 감사 로그가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                                        <td style={{ padding: "12px 16px", color: "#495057" }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                                            {log.skuId} {log.optionName && `(${log.optionName})`}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            {log.beforeQty} 개 → <strong>{log.afterQty} 개</strong>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "#e7f5ff", color: "#1c7ed6", fontSize: "12px", fontWeight: 600 }}>
                                                {log.reasonType || log.changeType}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "#495057" }}>{log.reasonMemo || "-"}</td>
                                        <td style={{ padding: "12px 16px", color: "#868e96" }}>{log.adminId}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 4. 신규 재고 등록 모달 */}
            <AddInventoryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={createProductInventory}
            />

            {/* 5. 수동 재고 조정 모달 */}
            {adjustTargetSku && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", width: "420px", maxWidth: "90%" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>수동 재고 조정</h3>
                        <p style={{ fontSize: "13px", color: "#495057", marginBottom: "16px" }}>
                            SKU: <strong>{adjustTargetSku.skuId}</strong> (현재 재고: {adjustTargetSku.currentQty}개)
                        </p>

                        <form onSubmit={handleAdjustSubmit}>
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                                    변동 수량 (+ 입고 / - 차감)
                                </label>
                                <input
                                    type="number"
                                    placeholder="예: 5 또는 -3"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ced4da", boxSizing: "border-box" }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>조정 사유</label>
                                <select
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value as AdjustmentReason)}
                                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ced4da" }}
                                >
                                    <option value="INCOMING">신규 입고 (INCOMING)</option>
                                    <option value="AUDIT">재고 조사 (AUDIT)</option>
                                    <option value="DAMAGED">파손/손실 (DAMAGED)</option>
                                    <option value="OTHER">기타 (OTHER)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>사유 메모</label>
                                <textarea
                                    rows={3}
                                    placeholder="조정 상세 사유를 입력하세요."
                                    value={adjustMemo}
                                    onChange={(e) => setAdjustMemo(e.target.value)}
                                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ced4da", boxSizing: "border-box" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setAdjustTargetSku(null)}
                                    style={{ padding: "8px 14px", borderRadius: "4px", border: "1px solid #ced4da", backgroundColor: "#fff", cursor: "pointer" }}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "8px 14px", borderRadius: "4px", border: "none", backgroundColor: "#1c7ed6", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                                >
                                    조정 적용
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}