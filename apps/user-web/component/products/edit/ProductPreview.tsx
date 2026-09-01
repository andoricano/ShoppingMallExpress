// component/products/ProductPreview.tsx

'use client';

import type { Product } from '@mall/types';

export type ProductPreviewProps = {
    product: Product;
};

export function ProductPreview({
    product,
}: ProductPreviewProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* 대표 이미지 */}
            <div className="aspect-square overflow-hidden bg-slate-100">
                {product.mainImageUrl ? (
                    <img
                        src={product.mainImageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        대표 이미지 없음
                    </div>
                )}
            </div>

            <div className="space-y-5 p-6">
                {/* 상품 정보 */}
                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-slate-900">
                            {product.name}
                        </h2>

                        <span
                            className={
                                product.isActive
                                    ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600'
                                    : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500'
                            }
                        >
                            {product.isActive
                                ? '판매 중'
                                : '비활성'}
                        </span>
                    </div>

                    <p className="text-2xl font-bold text-slate-900">
                        {product.price.toLocaleString()}원
                    </p>
                </div>

                {/* 추가 이미지 */}
                {product.imageUrls.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-slate-700">
                            상품 이미지
                        </h3>

                        <div className="grid grid-cols-4 gap-2">
                            {product.imageUrls.map(
                                (url, index) => (
                                    <div
                                        key={`${url}-${index}`}
                                        className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                                    >
                                        <img
                                            src={url}
                                            alt={`${product.name} 이미지 ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}

                {/* 상세 설명 */}
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                        상품 상세 설명
                    </h3>

                    <div className="min-h-[300px] rounded-lg border border-slate-200 bg-white p-4">
                        {product.description ? (
                            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                {product.description}
                            </pre>
                        ) : (
                            <p className="text-sm text-slate-400">
                                상품 상세 설명이 없습니다.
                            </p>
                        )}
                    </div>
                </div>

                {/* 기본 정보 */}
                <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
                    <p>
                        Inventory ID: {product.inventoryId}
                    </p>

                    <p className="mt-1">
                        상품 ID: {product.id}
                    </p>
                </div>
            </div>
        </div>
    );
}
