"use client";

import React, { useState } from "react";

export interface InventorySearchParams {
    search?: string;
    isActive?: boolean;
}

interface InventorySearchToolbarProps {
    onSearch: (params: InventorySearchParams) => void;
    onReset: () => void;
}

export const InventorySearchToolbar: React.FC<InventorySearchToolbarProps> = ({
    onSearch,
    onReset,
}) => {
    const [search, setSearch] = useState("");
    const [isActive, setIsActive] = useState<string>("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        onSearch({
            search: search.trim() || undefined,
            isActive:
                isActive === ""
                    ? undefined
                    : isActive === "true",
        });
    };

    const handleReset = () => {
        setSearch("");
        setIsActive("");
        onReset();
    };

    return (
        <div className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <form
                onSubmit={handleSearch}
                className="flex flex-wrap items-center gap-3"
            >
                {/* Ware 검색 */}
                <div className="flex-1 min-w-[220px]">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ware 코드 또는 이름 검색..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                {/* 활성 상태 */}
                <div className="min-w-[140px]">
                    <select
                        value={isActive}
                        onChange={(e) => setIsActive(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">전체 상태</option>
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                    </select>
                </div>

                {/* 버튼 */}
                <div className="flex items-center gap-2">
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
                </div>
            </form>
        </div>
    );
};
