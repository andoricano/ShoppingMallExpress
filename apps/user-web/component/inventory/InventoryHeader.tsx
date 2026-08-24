"use client";

import React from "react";

interface InventoryHeaderProps {
    onOpenAddModal: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ onOpenAddModal }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
            }}
        >
            <div>
                <h1
                    style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        margin: "0 0 8px 0",
                        color: "#212529",
                    }}
                >
                    재고 관리 (Admin)
                </h1>
                <p style={{ margin: 0, color: "#6c757d", fontSize: "14px" }}>
                    상품별 사이즈/옵션(SKU) 재고를 조회하고 수동 조정 및 신규 등록을 수행합니다.
                </p>
            </div>

            <button
                onClick={onOpenAddModal}
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
    );
};