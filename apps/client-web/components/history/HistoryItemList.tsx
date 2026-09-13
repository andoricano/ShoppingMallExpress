"use client";

import type { History } from "@mall/types";

import HistoryItem from "./HistoryItem";

interface HistoryItemListProps {
    historyList: History[];

    onSelect?: (
        history: History,
    ) => void;

    emptyMessage?: string;
}

export default function HistoryItemList({
    historyList,
    onSelect,
    emptyMessage = "History가 없습니다.",
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