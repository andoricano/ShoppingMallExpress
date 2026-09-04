"use client";

import { useParams } from "next/navigation";

import { useProductDetail } from "@/hooks/useProductDetail";
import { ProductPost } from "@/components/product/post/ProductPost";

export default function ProductDetailPage() {
    const params = useParams<{ id: string }>();

    const {
        product,
        reviews,
        loading,
        error,
    } = useProductDetail(params.id);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-5xl py-20 text-center">
                    <p className="text-sm text-slate-500">
                        상품을 불러오는 중입니다.
                    </p>
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-slate-50/50 p-6 md:p-8">
                <div className="mx-auto max-w-5xl py-20 text-center">
                    <p className="text-sm text-slate-500">
                        {error ?? "상품을 찾을 수 없습니다."}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <ProductPost
            product={product}
            reviews={reviews}
        />
    );
}