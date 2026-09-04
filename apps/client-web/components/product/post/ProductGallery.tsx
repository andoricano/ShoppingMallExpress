// component/products/post/ProductGallery.tsx

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
    onSelect?: (index: number) => void;
}

export function ProductGallery({
    images,
    onSelect,
}: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (images.length === 0) {
        return null;
    }

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        onSelect?.(index);
    };

    const move = (direction: number) => {
        const nextIndex =
            (selectedIndex + direction + images.length) %
            images.length;

        handleSelect(nextIndex);
    };

    return (
        <div className="flex items-center gap-2">
            {/* 이전 */}
            <button
                type="button"
                onClick={() => move(-1)}
                disabled={images.length <= 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronLeft size={16} />
            </button>

            {/* 이미지 큐 */}
            <div className="flex min-w-0 gap-2 overflow-hidden">
                {images.map((image, index) => (
                    <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => handleSelect(index)}
                        className={[
                            "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                            selectedIndex === index
                                ? "border-blue-500"
                                : "border-transparent",
                        ].join(" ")}
                    >
                        <img
                            src={image}
                            alt={`상품 이미지 ${index + 1}`}
                            className="h-full w-full object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* 다음 */}
            <button
                type="button"
                onClick={() => move(1)}
                disabled={images.length <= 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}