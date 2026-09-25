/** ProductPost card. Mall v2 ProductPosts carry no price; price belongs to ProductVariant. */
interface ProductPostCardProps {
    imageUrl?: string;
    title: string;
    summary?: string;
}

export function ProductPostCard({
    imageUrl,
    title,
    summary,
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
            </div>
        </div>
    );
}
