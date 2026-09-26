"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import type {
    ProductDetail,
    ProductVariantStockStatus,
} from "@mall/types";

import {
    getMinimumPrice,
    resolveVariant,
    type OptionSelection,
} from "@/utils/variantSelection";

import { ProductOptionSelector } from "./ProductOptionSelector";
import { ProductQuantitySelector } from "./ProductQuantitySelector";

/**
 * UI selection of one purchasable unit (Product + ProductVariant), the
 * identity used by Mall v2 Cart and Order. Contains no Ware information.
 */
export interface ProductVariantSelection {
    productId: string;
    productVariantId: string;
    quantity: number;
    unitPrice: number;
    isAvailable: boolean;
    stockStatus: ProductVariantStockStatus;
}

interface ProductPurchaseProps {
    products: ProductDetail[];

    onSelectionChange?: (
        selection: ProductVariantSelection | null,
    ) => void;

    /** Omitted until the Mall v2 Order flow is connected. */
    onPurchase?: (
        selection: ProductVariantSelection,
    ) => void;
}

const STOCK_STATUS_LABEL: Record<ProductVariantStockStatus, string> = {
    AVAILABLE: "구매 가능",
    OUT_OF_STOCK: "품절",
    SOLD_OUT: "품절",
    UNAVAILABLE: "판매 중지",
};

export function ProductPurchase({
    products,
    onSelectionChange,
    onPurchase,
}: ProductPurchaseProps) {
    const [selectedProductId, setSelectedProductId] =
        useState(products[0]?.id ?? "");
    const [selection, setSelection] =
        useState<OptionSelection>({});
    const [selectedVariantId, setSelectedVariantId] =
        useState("");
    const [quantity, setQuantity] =
        useState(1);

    const selectedProduct =
        products.find((product) => product.id === selectedProductId);

    const variant = useMemo(() => {
        if (!selectedProduct) {
            return null;
        }

        if (
            selectedProduct.options.length === 0
            && selectedProduct.variants.length > 1
        ) {
            return selectedProduct.variants.find(
                (item) => item.id === selectedVariantId,
            ) ?? null;
        }

        return resolveVariant(selectedProduct, selection);
    }, [selectedProduct, selection, selectedVariantId]);

    const purchaseSelection = useMemo<ProductVariantSelection | null>(
        () =>
            selectedProduct && variant
                ? {
                    productId: selectedProduct.id,
                    productVariantId: variant.id,
                    quantity,
                    unitPrice: variant.price,
                    isAvailable: variant.isAvailable,
                    stockStatus: variant.stockStatus,
                }
                : null,
        [selectedProduct, variant, quantity],
    );

    useEffect(() => {
        onSelectionChange?.(purchaseSelection);
    }, [purchaseSelection, onSelectionChange]);

    const handleProductChange = (productId: string) => {
        setSelectedProductId(productId);
        setSelection({});
        setSelectedVariantId("");
        setQuantity(1);
    };

    const minimumPrice =
        selectedProduct ? getMinimumPrice(selectedProduct) : null;

    const canPurchase =
        Boolean(onPurchase && purchaseSelection?.isAvailable);

    if (products.length === 0) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                판매 중인 상품이 없습니다.
            </section>
        );
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="space-y-6">
                {products.length > 1 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            상품 선택
                        </h2>

                        <div className="mt-3 space-y-2">
                            {products.map((product) => {
                                const price = getMinimumPrice(product);

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleProductChange(product.id)}
                                        className={[
                                            "w-full rounded-lg border p-4 text-left transition-colors",
                                            product.id === selectedProductId
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200 hover:bg-slate-50",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-900">
                                                {product.name}
                                            </span>

                                            {price !== null && (
                                                <span className="font-semibold text-slate-900">
                                                    {price.toLocaleString()}원~
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedProduct && (
                    <ProductOptionSelector
                        product={selectedProduct}
                        selection={selection}
                        onChange={(optionId, valueId) => {
                            setSelection((current) => ({
                                ...current,
                                [optionId]: valueId,
                            }));
                            setQuantity(1);
                        }}
                        selectedVariantId={selectedVariantId}
                        onVariantChange={(variantId) => {
                            setSelectedVariantId(variantId);
                            setQuantity(1);
                        }}
                    />
                )}

                <div className="h-px bg-slate-200" />

                {variant ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">
                                {variant.label ?? selectedProduct?.name}
                            </span>
                            <span
                                className={
                                    variant.isAvailable
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                }
                            >
                                {STOCK_STATUS_LABEL[variant.stockStatus]}
                            </span>
                        </div>

                        {variant.isAvailable && (
                            <ProductQuantitySelector
                                quantity={quantity}
                                onChange={setQuantity}
                            />
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        {selectedProduct && selectedProduct.variants.length === 0
                            ? "판매 중인 옵션이 없습니다."
                            : "옵션을 선택해 주세요."}
                    </p>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        총 상품 금액
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                        {variant
                            ? `${(variant.price * quantity).toLocaleString()}원`
                            : minimumPrice !== null
                                ? `${minimumPrice.toLocaleString()}원~`
                                : "-"}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (purchaseSelection && canPurchase) {
                            onPurchase?.(purchaseSelection);
                        }
                    }}
                    disabled={!canPurchase}
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    구매하기
                </button>

                {!onPurchase && (
                    <p className="text-center text-xs text-slate-400">
                        주문 기능은 준비 중입니다.
                    </p>
                )}
            </div>
        </section>
    );
}
