"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@mall/types";

import { useAdminProducts } from "@/hooks/products/useAdminProducts";

interface ProductPickerModalProps {
    /** Products already linked to the ProductPost draft. */
    excludeIds: string[];
    onSelect: (product: Product) => void;
    onClose: () => void;
}

/** Lists persisted Products only, so a ProductPost links saved Products. */
export function ProductPickerModal({ excludeIds, onSelect, onClose }: ProductPickerModalProps) {
    const { searchProducts } = useAdminProducts();
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (keyword?: string) => {
        setLoading(true);
        setError(null);

        try {
            setProducts(await searchProducts(keyword));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "상품 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [searchProducts]);

    useEffect(() => {
        const timer = setTimeout(() => void load(), 0);
        return () => clearTimeout(timer);
    }, [load]);

    const available = products.filter((product) => !excludeIds.includes(product.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <section className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">기존 상품 추가</h2>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void load(search.trim() || undefined);
                    }}
                    className="flex gap-2"
                >
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="상품명 검색"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                        검색
                    </button>
                </form>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                {loading ? (
                    <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
                ) : available.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">추가할 수 있는 상품이 없습니다.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {available.map((product) => (
                            <li key={product.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {product.isActive ? "판매 중" : "비활성"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelect(product)}
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    추가
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        닫기
                    </button>
                </div>
            </section>
        </div>
    );
}
