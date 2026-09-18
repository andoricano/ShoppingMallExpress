"use client";

import type { Product } from "@mall/types";

interface ProductOptionSelectorProps {
    products: Product[];
    selectedProductId: string;
    onChange: (productId: string) => void;
}

export function ProductOptionSelector({
    products,
    selectedProductId,
    onChange,
}: ProductOptionSelectorProps) {
    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-900">
                상품 선택
            </h2>

            <div className="mt-3 space-y-2">
                {products.map((product) => {
                    const selected =
                        selectedProductId ===
                        product.id;

                    return (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() =>
                                onChange(
                                    product.id,
                                )
                            }
                            className={[
                                "w-full rounded-lg border p-4 text-left transition-colors",
                                selected
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-slate-200 hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-900">
                                    {product.name}
                                </span>

                                <span className="font-semibold text-slate-900">
                                    {product.price.toLocaleString()}
                                    원
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}