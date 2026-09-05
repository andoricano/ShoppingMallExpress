// component/products/post/ProductPurchase.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@mall/types";

interface ProductPurchaseProps {
    products: Product[];
}

export function ProductPurchase({
    products,
}: ProductPurchaseProps) {
    console.log('products:', products)
    const router = useRouter();

    const [selectedProductId, setSelectedProductId] =
        useState(products[0]?.id ?? "");

    const [quantity, setQuantity] = useState(1);

    const selectedProduct = products.find(
        (product) =>
            product.id === selectedProductId,
    );

    const totalPrice = selectedProduct
        ? selectedProduct.price * quantity
        : 0;

    const handleQuantityChange = (
        value: number,
    ) => {
        setQuantity(Math.max(1, value));
    };

    const handlePurchase = () => {
        if (!selectedProduct) {
            return;
        }
        router.push("/order");
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-6">
                {/* 구매 상품 선택 */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        상품 선택
                    </h2>

                    <div className="mt-3 space-y-2">
                        {products.map((product) => (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                    setSelectedProductId(
                                        product.id,
                                    );
                                    setQuantity(1);
                                }}
                                className={`w-full rounded-lg border p-4 text-left transition-colors ${selectedProductId ===
                                    product.id
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-slate-900">
                                        {product.name}
                                    </span>

                                    <span className="font-semibold text-slate-900">
                                        {product.price.toLocaleString()}원
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-slate-200" />

                {/* 수량 */}
                {selectedProduct && (
                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            수량
                        </label>

                        <div className="mt-2 flex items-center">
                            <button
                                type="button"
                                onClick={() =>
                                    handleQuantityChange(
                                        quantity - 1,
                                    )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-l-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50"
                            >
                                −
                            </button>

                            <div className="flex h-10 min-w-14 items-center justify-center border-y border-slate-200 text-sm font-semibold">
                                {quantity}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    handleQuantityChange(
                                        quantity + 1,
                                    )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50"
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}

                {/* 결제 금액 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        총 상품 금액
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                        {totalPrice.toLocaleString()}원
                    </span>
                </div>

                {/* 구매 */}
                <button
                    type="button"
                    onClick={handlePurchase}
                    disabled={!selectedProduct}
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    구매하기
                </button>
            </div>
        </section>
    );
}