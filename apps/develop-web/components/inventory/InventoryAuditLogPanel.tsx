// @/components/inventory/InventoryAuditLogPanel.tsx
"use client";

import { InventoryLog } from "./useInventoryDev";


interface InventoryAuditLogPanelProps {
    logs: InventoryLog[];
}

// [신규 생성] 어드민 감사 로그(Audit Trail) 컴포넌트
export function InventoryAuditLogPanel({ logs }: InventoryAuditLogPanelProps) {
    return (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="text-md font-semibold text-white mb-4">
                어드민 감사 로그 (Audit Trail)
            </h3>
            {logs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                    기록된 재고 변동 이력이 없습니다.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-800 text-zinc-400 uppercase">
                            <tr>
                                <th className="p-2">일시</th>
                                <th className="p-2">SKU ID</th>
                                <th className="p-2">변동 유형</th>
                                <th className="p-2">변동 전/후</th>
                                <th className="p-2">담당자</th>
                                <th className="p-2">사유 메모</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="p-2 text-zinc-500 text-[11px]">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="p-2 font-mono text-zinc-400">
                                        {log.skuId}
                                    </td>
                                    <td className="p-2 text-white font-medium">
                                        {log.changeType}
                                    </td>
                                    <td className="p-2">
                                        <span className="text-zinc-400">
                                            {log.beforeQty}
                                        </span>{" "}
                                        ➔{" "}
                                        <span className="text-emerald-400 font-bold">
                                            {log.afterQty}
                                        </span>
                                    </td>
                                    <td className="p-2 text-zinc-400">{log.adminId}</td>
                                    <td className="p-2 text-zinc-400">
                                        {log.reasonMemo || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}