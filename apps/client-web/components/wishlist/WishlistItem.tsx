"use client";

interface WishlistItemProps {
    productPostId: string;

    onClick?: (
        productPostId: string,
    ) => void;

    onRemove?: (
        productPostId: string,
    ) => void;
}

export default function WishlistItem({
    productPostId,
    onClick,
    onRemove,
}: WishlistItemProps) {
    return (
        <article
            onClick={() =>
                onClick?.(
                    productPostId,
                )
            }
            className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
        >
            <div>
                <p className="font-medium text-slate-900">
                    상품 게시물
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    {productPostId}
                </p>
            </div>

            {onRemove && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();

                        onRemove(
                            productPostId,
                        );
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                    삭제
                </button>
            )}
        </article>
    );
}