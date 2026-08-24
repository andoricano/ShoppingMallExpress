"use client";

import { InventoryLog } from "@mall/types";
import React from "react";

interface InventoryAuditLogTableProps {
    logs: InventoryLog[];
    isLoading?: boolean;
}

export const InventoryAuditLogTable: React.FC<InventoryAuditLogTableProps> = ({
    logs,
    isLoading = false,
}) => {
    return (
        <div
            style={{
                width: "100%",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                backgroundColor: "#fff",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            <table
                style={{
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                    textAlign: "left",
                }}
            >
                <colgroup>
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "10%" }} />
                </colgroup>
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
                    {isLoading ? (
                        <tr>
                            <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#868e96" }}>
                                감사 로그를 불러오는 중입니다...
                            </td>
                        </tr>
                    ) : logs.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#868e96" }}>
                                기록된 감사 로그가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                                <td style={{ padding: "12px 16px", color: "#495057", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: "12px 16px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {log.skuId} {log.optionName && `(${log.optionName})`}
                                </td>
                                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                    {log.beforeQty} 개 → <strong>{log.afterQty} 개</strong>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span
                                        style={{
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            backgroundColor: "#e7f5ff",
                                            color: "#1c7ed6",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {log.reasonType || log.changeType}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 16px", color: "#495057", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {log.reasonMemo || "-"}
                                </td>
                                <td style={{ padding: "12px 16px", color: "#868e96", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {log.adminId}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};