"use client";

import { AdjustmentReason } from "@mall/types";
import React, { useState } from "react";

interface AdjustStockModalProps {
    isOpen: boolean;
    skuId: string;
    currentQty: number;
    onClose: () => void;
    onSubmit: (
        skuId: string,
        deltaQty: number,
        reason: AdjustmentReason,
        memo: string
    ) => Promise<void>;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
    isOpen,
    skuId,
    currentQty,
    onClose,
    onSubmit,
}) => {
    const [adjustQty, setAdjustQty] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState<AdjustmentReason>("AUDIT");
    const [adjustMemo, setAdjustMemo] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await onSubmit(skuId, adjustQty, adjustReason, adjustMemo);
            onClose();
        } catch (err: any) {
            alert(err.message || "재고 조정 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "#fff",
                    padding: "24px",
                    borderRadius: "8px",
                    width: "420px",
                    maxWidth: "90%",
                }}
            >
                <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>수동 재고 조정</h3>
                <p style={{ fontSize: "13px", color: "#495057", marginBottom: "16px" }}>
                    SKU: <strong>{skuId}</strong> (현재 재고: {currentQty}개)
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "12px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "4px",
                            }}
                        >
                            변동 수량 (+ 입고 / - 차감)
                        </label>
                        <input
                            type="number"
                            placeholder="예: 5 또는 -3"
                            value={adjustQty}
                            onChange={(e) => setAdjustQty(Number(e.target.value))}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                boxSizing: "border-box",
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "4px",
                            }}
                        >
                            조정 사유
                        </label>
                        <select
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value as AdjustmentReason)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                            }}
                        >
                            <option value="INCOMING">신규 입고 (INCOMING)</option>
                            <option value="AUDIT">재고 조사 (AUDIT)</option>
                            <option value="DAMAGED">파손/손실 (DAMAGED)</option>
                            <option value="OTHER">기타 (OTHER)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "4px",
                            }}
                        >
                            사유 메모
                        </label>
                        <textarea
                            rows={3}
                            placeholder="조정 상세 사유를 입력하세요."
                            value={adjustMemo}
                            onChange={(e) => setAdjustMemo(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: "8px 14px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "#1c7ed6",
                                color: "#fff",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {submitting ? "처리 중..." : "조정 적용"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};