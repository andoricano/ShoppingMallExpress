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

                {discount > 0 && (
                    <p className="mt-2 text-sm font-semibold text-rose-600">
                        {discount}% 할인
                    </p>
                )}

                <p className="mt-1 text-sm font-bold text-neutral-900">
                    {price.toLocaleString()}원
                </p>

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