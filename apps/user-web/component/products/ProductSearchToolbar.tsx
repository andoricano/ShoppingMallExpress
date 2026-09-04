"use client";

import React, { useState } from "react";

export interface ProductPostSearchParams {
    search?: string;
    isPublished?: boolean;
}

interface ProductPostSearchToolbarProps {
    onSearch: (params: ProductPostSearchParams) => void;
    onReset: () => void;
}

export const ProductPostSearchToolbar: React.FC<
    ProductPostSearchToolbarProps
> = ({
    onSearch,
    onReset,
}) => {
        const [search, setSearch] = useState("");
        const [isPublished, setIsPublished] = useState("");

        const handleSearch = (
            e: React.FormEvent,
        ) => {
            e.preventDefault();

            onSearch({
                search: search.trim() || undefined,
                isPublished:
                    isPublished === ""
                        ? undefined
                        : isPublished === "true",
            });
        };

        const handleReset = () => {
            setSearch("");
            setIsPublished("");
            onReset();
        };

        return (
            <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-wrap items-center gap-3"
                >
                    {/* 게시물 검색 */}
                    <div className="min-w-[220px] flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="게시물 제목 검색..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* 게시 상태 */}
                    <div className="min-w-[140px]">
                        <select
                            value={isPublished}
                            onChange={(e) =>
                                setIsPublished(e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">
                                전체 상태
                            </option>
                            <option value="true">
                                게시
                            </option>
                            <option value="false">
                                비공개
                            </option>
                        </select>
                    </div>

                    {/* 버튼 */}
                    <div className="flex items-center gap-2">
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
                    </div>
                </form>
            </div>
        );
    };