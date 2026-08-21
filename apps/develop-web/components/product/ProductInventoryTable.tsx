// @/components/product/ProductInventoryTable.tsx
"use client";

import { InventoryItem, StockStatus } from "@mall/types";
import { useMemo, useState } from "react";



// 재고 상태 배지 컴포넌트
function StatusBadge({ status }: { status: StockStatus }) {
    const statusStyles: Record<StockStatus, string> = {
        IN_STOCK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        LOW_STOCK: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        SOLD_OUT: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        DISABLED: "bg-zinc-800 text-zinc-500 border-zinc-700",
    };

    return (
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded border ${statusStyles[status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
            {status}
        </span>
    );
}

interface ProductInventoryTableProps {
    inventoryList: InventoryItem[];
    onSelectSku?: (item: InventoryItem) => void; // 단일 선택 (>)
    onAddSku?: (item: InventoryItem) => void;    // 목록에 추가 (+)
}

export function ProductInventoryTable({
    inventoryList = [],
    onSelectSku,
    onAddSku,
}: ProductInventoryTableProps) {
    // 테이블 내부 필터링 상태
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // 클라이언트 필터링 로직
    const filteredList = useMemo(() => {
        return inventoryList.filter((item) => {
            const matchesSearch =
                (item.skuId?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                (item.productName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
                (item.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "ALL" || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [inventoryList, searchQuery, statusFilter]);

    return (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            {/* 상단 검색 및 필터 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="SKU ID, 상품명, 카테고리 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2 py-1.5 text-xs rounded bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none"
                    >
                        <option value="ALL">전체 상태</option>
                        <option value="IN_STOCK">IN_STOCK</option>
                        <option value="LOW_STOCK">LOW_STOCK</option>
                        <option value="SOLD_OUT">SOLD_OUT</option>
                        <option value="DISABLED">DISABLED</option>
                    </select>
                    <span className="text-xs text-zinc-400">
                        총 <strong className="text-white">{filteredList.length}</strong>건
                    </span>
                </div>
            </div>

            {/* 재고 목록 테이블 */}
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-zinc-800 rounded">
                <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="sticky top-0 bg-zinc-800 text-zinc-400 uppercase text-[11px] z-10">
                        <tr>
                            <th className="p-2.5">SKU ID</th>
                            <th className="p-2.5">상품명</th>
                            <th className="p-2.5">카테고리</th>
                            <th className="p-2.5">현재고</th>
                            <th className="p-2.5">안전재고</th>
                            <th className="p-2.5">상태</th>
                            <th className="p-2.5 text-right">액션</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                        {filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-zinc-500">
                                    조회된 재고(SKU) 항목이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredList.map((item) => {
                                const recordJson = JSON.stringify(item, null, 2);

                                return (
                                    <tr
                                        key={item.skuId}
                                        className="hover:bg-zinc-800/40 transition-colors"
                                    >
                                        <td className="p-2.5 text-white font-medium">
                                            {item.productName || "-"}
                                        </td>
                                        <td className="p-2.5 text-zinc-400">
                                            {item.category || "-"}
                                        </td>
                                        <td className="p-2.5 font-bold text-zinc-200">
                                            {item.currentStock ?? 0}
                                        </td>
                                        <td className="p-2.5 text-zinc-400">
                                            {item.safetyStock ?? 0}
                                        </td>
                                        <td className="p-2.5">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="p-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* 추가(+) 버튼 */}
                                                {onAddSku && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onAddSku(item)}
                                                        title="상품 등록 구성으로 추가"
                                                        className="px-2 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-0.5"
                                                    >
                                                        <span>+</span>
                                                        <span className="hidden sm:inline text-[11px] font-normal">추가</span>
                                                    </button>
                                                )}

                                                {/* 선택(>) 버튼 */}
                                                {onSelectSku && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectSku(item)}
                                                        title="단일 선택"
                                                        className="px-2 py-1 text-xs font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
                                                    >
                                                        &gt;
                                                    </button>
                                                )}
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