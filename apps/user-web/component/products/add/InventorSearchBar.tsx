"use client";

import React, { useState } from "react";

interface InventorySearchBarProps {
    onSearch: (search: string) => void;
    onReset?: () => void;
}

export const InventorySearchBar: React.FC<InventorySearchBarProps> = ({
    onSearch,
    onReset,
}) => {
    const [search, setSearch] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSearch(search.trim());
    };

    const handleReset = () => {
        setSearch("");
        onReset?.();
    };

    return (
        <div className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2"
            >
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="SKU ID 검색..."
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
                >
                    검색
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                    초기화
                </button>
            </form>
        </div>
    );
};