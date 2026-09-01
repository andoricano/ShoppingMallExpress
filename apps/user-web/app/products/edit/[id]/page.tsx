// apps/user-web/app/products/edit/[id]/page.tsx

'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useProductEdit } from '@/hooks/products/useProductEdit';
import { ProductEditor } from '@/component/products/edit/ProductEditor';

export default function ProductEditPage() {
    const params = useParams<{ id: string }>();
    const productId = params.id;

    const {
        product,
        loading,
        saving,
        error,
        fetchProduct,
        updateProduct,
    } = useProductEdit(productId);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    if (loading) {
        return (
            <div className="p-6">
                상품 정보를 불러오는 중입니다...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-red-500">
                {error}
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-6">
                상품을 찾을 수 없습니다.
            </div>
        );
    }

    return (
        <ProductEditor
            product={product}
            saving={saving}
            onUpdate={updateProduct}
        />
    );
}