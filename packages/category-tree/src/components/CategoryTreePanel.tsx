// packages/category-tree/src/components/CategoryTreePanel.tsx

"use client";

import {
    useEffect,
    useState,
} from "react";

import type { CategoryTree } from "../types/categoryTree";

interface CategoryTreePanelProps {
    node: CategoryTree | null;

    onSaveName?: (
        name: string,
    ) => void;

    onAddChild?: () => void;

    onDelete?: () => void;
}

export default function CategoryTreePanel({
    node,
    onSaveName,
    onAddChild,
    onDelete,
}: CategoryTreePanelProps) {
    const [
        name,
        setName,
    ] = useState("");

    useEffect(() => {
        setName(
            node?.name ?? "",
        );
    }, [node]);

    if (!node) {
        return (
            <aside className="flex min-h-80 items-center justify-center rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-400">
                    Category를 선택해 주세요.
                </p>
            </aside>
        );
    }

    const hasChanges =
        name !== node.name;

    return (
        <aside className="min-h-80 rounded-xl border border-slate-200 bg-white p-5">
            <header className="mb-6">
                <h2 className="text-sm font-semibold text-slate-900">
                    Category Editor
                </h2>
            </header>

            <div className="space-y-5">
                {/* Category Name */}
                <div>
                    <label
                        htmlFor="category-name"
                        className="text-xs font-medium text-slate-400"
                    >
                        이름
                    </label>

                    <input
                        id="category-name"
                        type="text"
                        value={name}
                        onChange={(event) =>
                            setName(
                                event.target
                                    .value,
                            )
                        }
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
                    />
                </div>

                {/* ID */}
                <div>
                    <p className="text-xs font-medium text-slate-400">
                        ID
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-600">
                        {node.id}
                    </p>
                </div>

                {/* Parent */}
                <div>
                    <p className="text-xs font-medium text-slate-400">
                        Parent
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-600">
                        {node.parentId ??
                            "ROOT"}
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                    <button
                        type="button"
                        disabled={
                            !hasChanges
                        }
                        onClick={() =>
                            onSaveName?.(
                                name,
                            )
                        }
                        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        이름 저장
                    </button>

                    <button
                        type="button"
                        onClick={
                            onAddChild
                        }
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        하위 카테고리 추가
                    </button>

                    <button
                        type="button"
                        onClick={
                            onDelete
                        }
                        className="w-full rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                        카테고리 삭제
                    </button>
                </div>
            </div>
        </aside>
    );
}