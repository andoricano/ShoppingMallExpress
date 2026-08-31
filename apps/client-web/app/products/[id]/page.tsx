"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "@/config/products";

export default function ProductDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const product = products.find(
        (item) => item.id === params.id
    );

    if (!product) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-5xl py-20 text-center">
                    <p className="text-sm text-slate-500">
                        상품을 찾을 수 없습니다.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="grid grid-cols-1 gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
                    {/* 상품 이미지 */}
                    <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                        <img
                            src={product.mainImageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex flex-col">
                        <div>
                            <p className="font-mono text-xs text-slate-400">
                                {product.id}
                            </p>

                            <h1 className="mt-2 text-2xl font-bold text-slate-800">
                                {product.name}
                            </h1>

                            <p className="mt-3 text-xl font-bold text-slate-900">
                                {product.price.toLocaleString()}원
                            </p>

                            {product.description && (
                                <p className="mt-6 text-sm leading-6 text-slate-600">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        {/* 주문 */}
                        <div className="mt-auto pt-8">
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        `/orders/test?productId=${product.id}`
                                    )
                                }
                                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                            >
                                주문하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}