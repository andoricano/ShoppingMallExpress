"use client";

import type {
    PointLedgerEntry,
    PointLedgerType,
} from "@mall/types";

interface PointHistoryItemProps {
    item: PointLedgerEntry;
}

const TYPE_LABEL: Record<
    PointLedgerType,
    string
> = {
    TOPUP: "충전",
};

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function PointHistoryItem({
    item,
}: PointHistoryItemProps) {
    const isPositive = item.amount > 0;

    return (
        <div className="grid grid-cols-[160px_72px_minmax(0,1fr)_120px_120px] items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0">
            <span className="text-sm text-slate-500">
                {formatDate(item.createdAt)}
            </span>

            <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {TYPE_LABEL[item.type]}
            </span>

            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                    {TYPE_LABEL[item.type]}
                </p>
            </div>

            <span
                className={[
                    "text-right text-sm font-semibold",
                    isPositive
                        ? "text-slate-900"
                        : "text-slate-600",
                ].join(" ")}
            >
                {isPositive ? "+" : ""}
                {item.amount.toLocaleString(
                    "ko-KR",
                )}
                <span className="ml-0.5 text-xs">
                    P
                </span>
            </span>

            <span className="text-right text-sm text-slate-500">
                {item.balanceAfter.toLocaleString(
                    "ko-KR",
                )}
                <span className="ml-0.5 text-xs">
                    P
                </span>
            </span>
        </div>
    );
}