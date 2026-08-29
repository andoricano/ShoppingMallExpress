// components/products/add/ProductsTable.tsx

"use client";

import React from "react";
import type { Product } from "@mall/types";

interface ProductsTableProps {
    products: Product[];
    isLoading?: boolean;
    onEdit?: (product: Product) => void;
    onToggleStatus?: (productId: string) => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
    products = [],
    isLoading = false,
    onEdit,
    onToggleStatus,
}) => {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">
                    Products
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                    등록된 상품과 Inventory 연결 상태를 확인합니다.
                </p>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                        상품 목록을 불러오는 중입니다...
                    </div>
                ) : products.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-400">
                        등록된 상품이 없습니다.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50">
                            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                                <th className="px-4 py-3">
                                    상품 ID
                                </th>
                                <th className="px-4 py-3">
                                    상품명
                                </th>
                                <th className="px-4 py-3">
                                    가격
                                </th>
                                <th className="px-4 py-3">
                                    상태
                                </th>
                                <th className="px-4 py-3 text-right">
                                    관리
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {products.map((product) => (
                                <tr
                                    key={product.id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-slate-500">
                                            {product.id}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-700">
                                            {product.name}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                        {product.price.toLocaleString()}원
                                    </td>

                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${product.isActive
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            {product.isActive
                                                ? "활성"
                                                : "비활성"}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onEdit(product)
                                                    }
                                                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                                >
                                                    수정
                                                </button>
                                            )}

                                            {onToggleStatus && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onToggleStatus(
                                                            product.id
                                                        )
                                                    }
                                                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${product.isActive
                                                            ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                            : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                        }`}
                                                >
                                                    {product.isActive
                                                        ? "비활성화"
                                                        : "활성화"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};