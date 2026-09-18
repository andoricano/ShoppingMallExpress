"use client";

import {
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import type {
    CartItem,
} from "@mall/types";
import type {
    Product,
} from "@mall/types";

import { useCartStore } from "@/store/cartStore";

import { ProductOptionSelector } from "./ProductOptionSelector";
import { ProductQuantitySelector } from "./ProductQuantitySelector";

interface ProductPurchaseProps {
    products: Product[];

    onSelectionChange?: (
        item: CartItem,
    ) => void;
}

export function ProductPurchase({
    products,
    onSelectionChange,
}: ProductPurchaseProps) {
    const router = useRouter();

    const [
        selectedProductId,
        setSelectedProductId,
    ] = useState(
        products[0]?.id ?? "",
    );

    const [
        quantity,
        setQuantity,
    ] = useState(1);

    const selectedProduct =
        products.find(
            (product) =>
                product.id ===
                selectedProductId,
        );

    useEffect(() => {
        if (!selectedProduct) {
            return;
        }

        onSelectionChange?.({
            product: selectedProduct,
            quantity,
        });
    }, [
        selectedProduct,
        quantity,
        onSelectionChange,
    ]);

    const totalPrice =
        selectedProduct
            ? selectedProduct.price *
            quantity
            : 0;

    const addItem = useCartStore(
        (state) => state.addItem,
    );

    const handlePurchase = () => {
        if (!selectedProduct) {
            return;
        }

        addItem({
            product: selectedProduct,
            quantity,
        });

        router.push("/order");
    };

    const handleProductChange = (
        productId: string,
    ) => {
        setSelectedProductId(
            productId,
        );
        setQuantity(1);
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-6">
                <ProductOptionSelector
                    products={products}
                    selectedProductId={
                        selectedProductId
                    }
                    onChange={
                        handleProductChange
                    }
                />

                <div className="h-px bg-slate-200" />

                {selectedProduct && (
                    <ProductQuantitySelector
                        quantity={quantity}
                        onChange={
                            setQuantity
                        }
                    />
                )}

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        총 상품 금액
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                        {totalPrice.toLocaleString()}
                        원
                    </span>
                </div>

                <button
                    type="button"
                    onClick={
                        handlePurchase
                    }
                    disabled={
                        !selectedProduct
                    }
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    구매하기
                </button>
            </div>
        </section>
    );
}