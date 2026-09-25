"use client";

import type { PointLedgerEntry } from "@mall/types";
import { useMemo, useState } from "react";
import { PointHistoryItem } from "./PointHistoryItem";


interface PointHistoryCardProps {
    items: PointLedgerEntry[];

    pageSize?: number;
}

export function PointHistoryCard({
    items,
    pageSize = 20,
}: PointHistoryCardProps) {
    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(
            items.length / pageSize,
        ),
    );

    const currentItems =
        useMemo(() => {
            const start =
                (currentPage - 1) *
                pageSize;

            return items.slice(
                start,
                start + pageSize,
            );
        }, [
            items,
            currentPage,
            pageSize,
        ]);

    const handlePrevious = () => {
        setCurrentPage(
            (page) => Math.max(1, page - 1),
        );
    };

    const handleNext = () => {
        setCurrentPage(
            (page) =>
                Math.min(
                    totalPages,
                    page + 1,
                ),
        );
    };

    const handlePageChange = (
        page: number,
    ) => {
        setCurrentPage(page);
    };

    const pageNumbers = useMemo(() => {
        return Array.from(
            { length: totalPages },
            (_, index) => index + 1,
        );
    }, [totalPages]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                    포인트 이용 내역
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    포인트 충전 및 사용 내역을 확인합니다.
                </p>
            </div>

            {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
                    <p className="text-sm text-slate-500">
                        포인트 이용 내역이 없습니다.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                            <div className="grid grid-cols-[160px_72px_minmax(0,1fr)_120px_120px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                                <span>
                                    사용 일시
                                </span>

                                <span>
                                    구분
                                </span>

                                <span>
                                    내용
                                </span>

                                <span className="text-right">
                                    변동 포인트
                                </span>

                                <span className="text-right">
                                    잔여 포인트
                                </span>
                            </div>

                            <div>
                                {currentItems.map(
                                    (item) => (
                                        <PointHistoryItem
                                            key={
                                                item.id
                                            }
                                            item={
                                                item
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-1">
                            <button
                                type="button"
                                onClick={
                                    handlePrevious
                                }
                                disabled={
                                    currentPage ===
                                    1
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                이전
                            </button>

                            {pageNumbers.map(
                                (page) => (
                                    <button
                                        key={
                                            page
                                        }
                                        type="button"
                                        onClick={() =>
                                            handlePageChange(
                                                page,
                                            )
                                        }
                                        className={[
                                            "min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                            currentPage ===
                                            page
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-600 hover:bg-slate-50",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        {page}
                                    </button>
                                ),
                            )}

                            <button
                                type="button"
                                onClick={
                                    handleNext
                                }
                                disabled={
                                    currentPage ===
                                    totalPages
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}