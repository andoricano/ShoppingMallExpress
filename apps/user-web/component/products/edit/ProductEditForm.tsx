// component/products/ProductEditForm.tsx

'use client';

import { useState } from 'react';
import type { Product } from '@mall/types';

export type ProductEditFormProps = {
    product: Product;
    onSubmit?: (product: Product) => void;
};

export function ProductEditForm({
    product,
    onSubmit,
}: ProductEditFormProps) {
    const [name, setName] = useState(product.name);
    const [mainImageUrl, setMainImageUrl] = useState(
        product.mainImageUrl,
    );
    const [imageUrls, setImageUrls] = useState(
        product.imageUrls.join('\n'),
    );
    const [price, setPrice] = useState(
        String(product.price),
    );
    const [isActive, setIsActive] = useState(
        product.isActive,
    );
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setError(null);

        const nextProduct: Product = {
            ...product,
            name: name.trim(),
            mainImageUrl: mainImageUrl.trim(),
            imageUrls: imageUrls
                .split('\n')
                .map((url) => url.trim())
                .filter(Boolean),
            price: Number(price),
            isActive,
        };

        if (!nextProduct.name) {
            setError('상품명을 입력해주세요.');
            return;
        }

        if (nextProduct.price < 0) {
            setError('가격은 0 이상이어야 합니다.');
            return;
        }

        onSubmit?.(nextProduct);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Inventory ID
                </label>

                <input
                    type="text"
                    value={product.inventoryId}
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    상품명
                </label>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="상품명을 입력하세요."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    대표 이미지 URL
                </label>

                <input
                    type="text"
                    value={mainImageUrl}
                    onChange={(e) =>
                        setMainImageUrl(e.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    추가 이미지 URL
                </label>

                <textarea
                    value={imageUrls}
                    onChange={(e) =>
                        setImageUrls(e.target.value)
                    }
                    placeholder="이미지 URL을 한 줄에 하나씩 입력하세요."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    가격
                </label>

                <input
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) =>
                        setIsActive(e.target.checked)
                    }
                />

                상품 활성화
            </label>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
                상품 정보 저장
            </button>
        </form>
    );
}