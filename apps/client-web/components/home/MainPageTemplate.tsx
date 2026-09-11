// apps/client-web/components/template/MainPageTemplate.tsx

"use client";

import { toProductCardDataList } from "@/utils/productConverter";
import {
    MallTemplate,
    mainPageMock,
} from "@mall/mall-page-viewer";

import type { Product } from "@mall/types";


interface MainPageTemplateProps {
    products: Product[];
    loading: boolean;
    error: string | null;
}

export default function MainPageTemplate({
    products,
    loading,
    error,
}: MainPageTemplateProps) {
    const productCards =
        toProductCardDataList(products);

    const config = {
        ...mainPageMock,

        sections:
            mainPageMock.sections.map(
                (section) => {
                    if (
                        section.type !==
                        "PRODUCT"
                    ) {
                        return section;
                    }

                    return {
                        ...section,
                        products:
                            productCards,
                    };
                },
            ),
    };

    const handleNavigate = (
        path: string,
    ) => {
        window.location.href = path;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                상품을 불러오는 중입니다.
            </div>
        );
    }

    return (
        <>
            <MallTemplate
                config={config}
                isLoggedIn={false}
                cartItemCount={0}
                wishlistItemCount={0}
                onNavigate={
                    handleNavigate
                }
            />

            {error && (
                <div className="fixed bottom-4 right-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
                    {error}
                </div>
            )}
        </>
    );
}