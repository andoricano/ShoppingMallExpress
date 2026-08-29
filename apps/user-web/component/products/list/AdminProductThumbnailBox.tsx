"use client";

import React from "react";
import type { Product } from "@mall/types";

interface AdminProductThumbnailBoxProps {
    product: Product;
    onEdit?: (product: Product) => void;
    onToggleStatus?: (productId: string) => void;
    onDelete?: (productId: string) => void;
}

export const AdminProductThumbnailBox: React.FC<
    AdminProductThumbnailBoxProps
> = ({
    product,
    onEdit,
    onToggleStatus,
    onDelete,
}) => {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* 상품 이미지 */}
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <img
                        src={product.mainImageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />

                    {/* Product ID */}
                    <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1">
                        <span className="font-mono text-[10px] text-white">
                            {product.id}
                        </span>
                    </div>
                </div>

                <div className="p-4">
                    {/* 상품명 / 가격 */}
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-slate-800">
                            {product.name}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                            {product.price.toLocaleString()}원
                        </p>
                    </div>

                    {/* 상태 */}
                    <div className="mb-4">
                        <span
                            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${product.isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-slate-100 text-slate-500"
                                }`}
                        >
                            {product.isActive ? "판매중" : "비활성"}
                        </span>
                    </div>

                    {/* 날짜 */}
                    <div className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
                        <div className="flex justify-between gap-3">
                            <span>생성</span>
                            <span className="text-right text-slate-500">
                                {new Date(product.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <div className="flex justify-between gap-3">
                            <span>수정</span>
                            <span className="text-right text-slate-500">
                                {new Date(product.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* 관리 버튼 */}
                    <div className="mt-4 flex items-center gap-2">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(product)}
                                className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                수정
                            </button>
                        )}

                        {onToggleStatus && (
                            <button
                                type="button"
                                onClick={() => onToggleStatus(product.id)}
                                className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${product.isActive
                                        ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    }`}
                            >
                                {product.isActive ? "비활성화" : "활성화"}
                            </button>
                        )}

                        {!product.isActive && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(product.id)}
                                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100"
                            >
                                삭제
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };