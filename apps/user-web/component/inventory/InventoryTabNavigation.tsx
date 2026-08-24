"use client";

import React from "react";

export type InventoryTabType = "inventory" | "logs";

interface InventoryTabNavigationProps {
    activeTab: InventoryTabType;
    onTabChange: (tab: InventoryTabType) => void;
}

export const InventoryTabNavigation: React.FC<InventoryTabNavigationProps> = ({
    activeTab,
    onTabChange,
}) => {
    return (
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e9ecef", marginBottom: "20px" }}>
            <button
                onClick={() => onTabChange("inventory")}
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
                onClick={() => onTabChange("logs")}
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
    );
};