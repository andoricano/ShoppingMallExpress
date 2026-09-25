"use client";

import type { ClientHistoryItem } from "@mall/types";

import HistoryItem from "./HistoryItem";

interface HistoryItemListProps {
    historyList: ClientHistoryItem[];

    onSelect?: (
        history: ClientHistoryItem,
    ) => void;

    emptyMessage?: string;
}

export default function HistoryItemList({
    historyList,
    onSelect,
    emptyMessage = "주문 내역이 없습니다.",
}: HistoryItemListProps) {
    if (historyList.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {historyList.map((history) => (
                <HistoryItem
                    key={history.id}
                    history={history}
                    onClick={onSelect}
                />
            ))}
        </div>
    );
}