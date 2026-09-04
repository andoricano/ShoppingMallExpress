// component/products/post/ProductReview.tsx

"use client";

interface ProductReviewData {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    content: string;
    createdAt: string;
}

interface ProductReviewProps {
    productId: string;
    reviews: ProductReviewData[];
}

export function ProductReview({
    productId,
    reviews,
}: ProductReviewProps) {
    const reviewCount = reviews.length;

    const averageRating =
        reviewCount > 0
            ? reviews.reduce(
                  (sum, review) => sum + review.rating,
                  0,
              ) / reviewCount
            : 0;

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
                            {averageRating.toFixed(1)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            리뷰
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {reviewCount}개
                        </p>
                    </div>
                </div>

                {reviewCount > 0 ? (
                    <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
                        {reviews.map((review) => (
                            <article
                                key={review.id}
                                className="rounded-lg border border-slate-100 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-slate-900">
                                        {review.userName}
                                    </p>

                                    <p className="text-sm font-semibold text-slate-600">
                                        {review.rating.toFixed(1)}
                                    </p>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    {review.content}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                    {review.createdAt}
                                </p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="mt-6 border-t border-slate-200 pt-6 text-center">
                        <p className="text-sm text-slate-400">
                            등록된 리뷰가 없습니다.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}