// components/orders/list/OrderSearchBar.tsx

"use client";

import React, { useState } from "react";

interface OrderSearchBarProps {
    onSearch: (search: string) => void;
    onReset?: () => void;
}

export const OrderSearchBar: React.FC<
    OrderSearchBarProps
> = ({
    onSearch,
    onReset,
}) => {
        const [search, setSearch] =
            useState("");

        const handleSubmit = (
            e: React.FormEvent,
        ) => {
            e.preventDefault();

            onSearch(search.trim());
        };

        const handleReset = () => {
            setSearch("");
            onReset?.();
        };

        return (
            <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value,
                            )
                        }
                        placeholder="주문번호 또는 Client ID 검색..."
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />

                    <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                    >
                        검색
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
                    >
                        초기화
                    </button>
                </form>
            </div>
        );
    };