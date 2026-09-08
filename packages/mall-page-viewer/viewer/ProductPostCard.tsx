interface ProductPostCardProps {
    imageUrl?: string;
    title: string;
    summary?: string;
    discount: number;
    price: number;
    tags: string[];
}

export function ProductPostCard({
    imageUrl,
    title,
    summary,
    discount,
    price,
    tags,
}: ProductPostCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* 게시물 이미지 */}
            <div className="aspect-square overflow-hidden bg-neutral-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                        대표 이미지 없음
                    </div>
                )}
            </div>

            {/* 게시물 정보 */}
            <div className="p-4">
                <h3 className="truncate text-sm font-semibold text-neutral-900">
                    {title}
                </h3>

                {summary && (
                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                        {summary}
                    </p>
                )}

                {/* 가격 */}
                <div className="mt-3">
                    {discount > 0 ? (
                        <>
                            {/* 원래 가격 */}
                            <p className="text-sm text-slate-400 line-through">
                                {price.toLocaleString()}원
                            </p>

                            {/* 할인가 */}
                            <p className="mt-0.5 text-xl font-bold text-rose-600">
                                {discount.toLocaleString()}원
                            </p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-neutral-900">
                            {price.toLocaleString()}원
                        </p>
                    )}
                </div>

                {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
