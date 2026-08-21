// apps/develop-web/components/order/OrderAuditLogPanel.tsx
"use client";

import React from "react";
import type { AuditLogItem } from "./useOrderDev";

interface OrderAuditLogPanelProps {
    logs: AuditLogItem[];
}

export function OrderAuditLogPanel({ logs }: OrderAuditLogPanelProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-sm text-gray-800">
                    📜 주문 이벤트 감사 로그 (Audit Logs)
                </h3>
                <span className="text-xs text-gray-400">총 {logs.length}건</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                        <tr>
                            <th className="p-3.5">발생 일시</th>
                            <th className="p-3.5">수행 액션</th>
                            <th className="p-3.5">관련 주문 ID</th>
                            <th className="p-3.5">상세 기록 내용</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    기록된 감사 로그가 존재하지 않습니다.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/80 transition">
                                    <td className="p-3.5 text-gray-500 font-mono">{log.timestamp}</td>
                                    <td className="p-3.5 font-bold text-gray-800">{log.action}</td>
                                    <td className="p-3.5 font-mono text-blue-600">{log.orderId || "-"}</td>
                                    <td className="p-3.5 text-gray-600">{log.details}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}