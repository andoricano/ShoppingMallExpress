// component/products/post/ProductReview.tsx

"use client";

interface ProductReviewProps {
    productId: string;
}

export function ProductReview({
    productId,
}: ProductReviewProps) {
    return (
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">
                    상품 리뷰
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    상품을 구매하신 고객님의 리뷰입니다.
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">
                            평균 평점
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            0.0
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            리뷰
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            0개
                        </p>
                    </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6 text-center">
                    <p className="text-sm text-slate-400">
                        등록된 리뷰가 없습니다.
                    </p>
                </div>
            </div>
        </section>
    );
}