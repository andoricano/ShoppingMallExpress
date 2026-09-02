// component/products/ProductEditHeader.tsx

"use client";

import React from "react";

export interface ProductEditHeaderProps {
    productName: string;

    onSave: () => void;
    onDelete?: () => void;
    onToggleActive?: () => void;

    mode?: "create" | "edit";
}

export const ProductEditHeader: React.FC<ProductEditHeaderProps> = ({
    productName,
    onSave,
    onDelete,
    onToggleActive,
    mode = "edit",
}) => {
    return (
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {mode === "create"
                        ? "상품 등록"
                        : "상품 수정"}
                </h1>

                {productName && (
                    <p className="mt-1 text-sm text-slate-500">
                        {productName}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {mode === "edit" && onToggleActive && (
                    <button
                        type="button"
                        onClick={onToggleActive}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
                    >
                        비활성화
                    </button>
                )}

                {mode === "edit" && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 shadow-sm transition-colors hover:bg-rose-50 active:bg-rose-100"
                    >
                        삭제하기
                    </button>
                )}

                <button
                    type="button"
                    onClick={onSave}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
                >
                    {mode === "create"
                        ? "등록하기"
                        : "수정하기"}
                </button>
            </div>
        </div>
    );
};