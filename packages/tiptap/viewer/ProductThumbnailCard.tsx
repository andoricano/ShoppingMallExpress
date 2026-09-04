// packages/tiptap/.../ProductThumbnailCard.tsx

interface ProductThumbnailCardProps {
    imageUrl?: string;
    name: string;
    summary?: string;
    price: number;
}

export function ProductThumbnailCard({
    imageUrl,
    name,
    summary,
    price,
}: ProductThumbnailCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* 상품 이미지 */}
            <div className="aspect-square overflow-hidden bg-neutral-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                        대표 이미지 없음
                    </div>
                )}
            </div>

            {/* 상품 정보 */}
            <div className="p-4">
                <h3 className="truncate text-sm font-semibold text-neutral-900">
                    {name}
                </h3>

                {summary && (
                    <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                        {summary}
                    </p>
                )}

                <p className="mt-2 text-sm font-bold text-neutral-900">
                    {price.toLocaleString()}원
                </p>
            </div>
        </div>
    );
}