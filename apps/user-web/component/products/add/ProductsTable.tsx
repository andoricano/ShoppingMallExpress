// components/products/add/ProductsTable.tsx

"use client";

import React from "react";
import type { Product } from "@mall/types";

interface ProductsTableProps {
    products: Product[];

    onEdit?: (product: Product) => void;
    onRemove?: (productId: string) => void;
    onMove?: (fromIndex: number, toIndex: number) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
    products = [],
    onEdit,
    onRemove,
    onMove,
}) => {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">
                    Products
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                    현재 게시물에 등록된 상품을 관리합니다.
                </p>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {products.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                        등록된 상품이 없습니다.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50">
                            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                                <th className="px-4 py-3">
                                    순서
                                </th>

                                <th className="px-4 py-3">
                                    상품명
                                </th>

                                <th className="px-4 py-3">
                                    상태
                                </th>

                                <th className="px-4 py-3">
                                    Variant
                                </th>

                                <th className="px-4 py-3 text-right">
                                    관리
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {products.map(
                                (product, index) => (
                                    <tr
                                        key={product.id}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="px-4 py-3 text-slate-500">
                                            {index + 1}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-700">
                                                {product.name}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-700">
                                            {product.isActive ? "판매 중" : "비활성"}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-slate-500">
                                                {product.id}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                {onMove &&
                                                    index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onMove(
                                                                    index,
                                                                    index - 1,
                                                                )
                                                            }
                                                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                                        >
                                                            ↑
                                                        </button>
                                                    )}

                                                {onMove &&
                                                    index <
                                                    products.length -
                                                    1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onMove(
                                                                    index,
                                                                    index + 1,
                                                                )
                                                            }
                                                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                                        >
                                                            ↓
                                                        </button>
                                                    )}

                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onEdit(
                                                                product,
                                                            )
                                                        }
                                                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                                    >
                                                        수정
                                                    </button>
                                                )}

                                                {onRemove && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onRemove(
                                                                product.id,
                                                            )
                                                        }
                                                        className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100"
                                                    >
                                                        제거
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
