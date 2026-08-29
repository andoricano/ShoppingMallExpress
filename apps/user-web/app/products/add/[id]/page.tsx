"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAdminProducts } from "@/hooks/products/useAdminProduct";
import { ModalFooterActions } from "@/component/modal/ModalFooterActions";

export default function ProductAddPage() {
    const router = useRouter();

    const params = useParams<{ id: string }>();


    const inventoryId = params.id;

    const { createProduct, loading, error } = useAdminProducts();

    const [name, setName] = useState("");
    const [mainImageUrl, setMainImageUrl] = useState("");
    const [imageUrls, setImageUrls] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [isActive, setIsActive] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inventoryId) {
            alert("연결할 Inventory가 없습니다.");
            return;
        }

        if (!name.trim()) {
            alert("상품명을 입력해주세요.");
            return;
        }


        const parsedPrice = Number(price);

        if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
            alert("가격은 0 이상의 정수여야 합니다.");
            return;
        }

        const parsedImageUrls = imageUrls
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean);

        try {
            await createProduct({
                name: name.trim(),
                mainImageUrl: mainImageUrl.trim(),
                imageUrls: parsedImageUrls,
                description,
                price: parsedPrice,
                inventoryId,
                isActive,
            });

            router.push("/products");
        } catch {
            // hook에서 error 상태 처리
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">
                        상품 등록
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        선택한 Inventory를 연결하여 상품을 등록합니다.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                            Inventory ID
                        </label>

                        <input
                            type="text"
                            value={inventoryId}
                            disabled
                            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">
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
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                            대표 이미지 URL
                        </label>

                        <input
                            type="text"
                            value={mainImageUrl}
                            onChange={(e) => setMainImageUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                            추가 이미지 URL
                        </label>

                        <textarea
                            value={imageUrls}
                            onChange={(e) => setImageUrls(e.target.value)}
                            placeholder={"이미지 URL을 한 줄에 하나씩 입력하세요."}
                            rows={4}
                            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">
                            상품 설명
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="상품 설명을 입력하세요."
                            rows={5}
                            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">
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
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        상품 활성화
                    </label>

                    {error && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}


                    <ModalFooterActions
                        onCancel={() => router.back()}
                        submitText="상품 등록"
                        cancelText="취소"
                        isSubmitting={loading}
                    />

                </form>
            </div>
        </div>
    );
}