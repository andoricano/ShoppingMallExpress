// component/products/post/ProductPurchase.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@mall/types";

interface ProductPurchaseProps {
    product: Product;
}

export function ProductPurchase({
    product,
}: ProductPurchaseProps) {
    const router = useRouter();

    const [quantity, setQuantity] = useState(1);

    const totalPrice = product.price * quantity;

    const handleQuantityChange = (value: number) => {
        setQuantity(Math.max(1, value));
    };

    const handlePurchase = () => {
        router.push(`/purchase/${product.id}`);
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-6">
                {/* 상품 정보 */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {product.name}
                    </h2>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {product.price.toLocaleString()}원
                    </p>
                </div>

                <div className="h-px bg-slate-200" />

                {/* 수량 */}
                <div>
                    <label className="text-sm font-semibold text-slate-700">
                        수량
                    </label>

                    <div className="mt-2 flex items-center">
                        <button
                            type="button"
                            onClick={() =>
                                handleQuantityChange(quantity - 1)
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
                                handleQuantityChange(quantity + 1)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50"
                        >
                            +
                        </button>
                    </div>
                </div>

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
                    disabled={!product.isActive}
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {product.isActive
                        ? "구매하기"
                        : "판매 종료"}
                </button>
            </div>
        </section>
    );
}