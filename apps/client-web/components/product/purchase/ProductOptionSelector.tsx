"use client";

import type { ProductDetail } from "@mall/types";

import {
    getOptionValueState,
    type OptionSelection,
} from "@/utils/variantSelection";

interface ProductOptionSelectorProps {
    product: ProductDetail;
    selection: OptionSelection;
    onChange: (optionId: string, valueId: string) => void;
    /** Used only for a Product without options and several Variants. */
    selectedVariantId: string;
    onVariantChange: (variantId: string) => void;
}

const buttonClass = (selected: boolean, disabled: boolean) =>
    [
        "rounded-lg border px-3 py-2 text-sm transition-colors",
        selected
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        disabled ? "cursor-not-allowed opacity-40 hover:bg-white" : "",
    ].join(" ");

/** Option → Variant selection for one Product. Shows no stock quantity. */
export function ProductOptionSelector({
    product,
    selection,
    onChange,
    selectedVariantId,
    onVariantChange,
}: ProductOptionSelectorProps) {
    if (product.options.length === 0) {
        if (product.variants.length <= 1) {
            return null;
        }

        return (
            <div>
                <h3 className="text-sm font-semibold text-slate-700">옵션</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                        <button
                            key={variant.id}
                            type="button"
                            onClick={() => onVariantChange(variant.id)}
                            className={buttonClass(selectedVariantId === variant.id, false)}
                        >
                            {variant.label ?? variant.skuCode ?? "기본"} · {variant.price.toLocaleString()}원
                            {!variant.isAvailable && " (품절)"}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {product.options.map((option) => (
                <div key={option.id}>
                    <h3 className="text-sm font-semibold text-slate-700">
                        {option.name}
                        {!option.isRequired && (
                            <span className="ml-1 text-xs font-normal text-slate-400">(선택)</span>
                        )}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {option.values.map((value) => {
                            const selected = selection[option.id] === value.id;
                            const state = getOptionValueState(product, selection, option.id, value.id);
                            const disabled = state === "UNAVAILABLE" && !selected;

                            return (
                                <button
                                    key={value.id}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onChange(option.id, selected ? "" : value.id)}
                                    className={buttonClass(selected, disabled)}
                                >
                                    {value.value}
                                    {state === "SOLD_OUT" && " (품절)"}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
