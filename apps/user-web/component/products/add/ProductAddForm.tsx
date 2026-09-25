// component/products/add/ProductAddForm.tsx

"use client";

import type {
    ProductOptionCreateInput,
    ProductVariantCreateInput,
} from "@mall/types";

import FormField from "@/component/common/field/FormField";

export interface ProductOptionDraft {
    name: string;
    /** Comma-separated OptionValue labels. */
    values: string;
}

export interface ProductAddFormValue {
    name: string;
    description: string;
    /** Default price for every generated Variant. */
    basePrice: number;
    options: ProductOptionDraft[];
    /** Per-Variant overrides keyed by the option combination key. */
    variantPrices: Record<string, number>;
    variantSkuCodes: Record<string, string>;
}

export interface ProductVariantDraft {
    key: string;
    label: string | null;
    optionValues: Record<string, string>;
}

export function emptyProductAddForm(name = ""): ProductAddFormValue {
    return {
        name,
        description: "",
        basePrice: 0,
        options: [],
        variantPrices: {},
        variantSkuCodes: {},
    };
}

function parseValues(values: string) {
    return Array.from(
        new Set(values.split(",").map((value) => value.trim()).filter(Boolean)),
    );
}

export function toProductOptions(value: ProductAddFormValue): ProductOptionCreateInput[] {
    return value.options
        .map((option) => ({
            name: option.name.trim(),
            isRequired: true,
            values: parseValues(option.values),
        }))
        .filter((option) => option.name !== "" && option.values.length > 0);
}

/** Every combination of the entered option values; one default Variant without options. */
export function toVariantDrafts(value: ProductAddFormValue): ProductVariantDraft[] {
    const options = toProductOptions(value);

    if (options.length === 0) {
        return [{ key: "default", label: null, optionValues: {} }];
    }

    let combinations: Record<string, string>[] = [{}];

    for (const option of options) {
        combinations = combinations.flatMap((combination) =>
            option.values.map((optionValue) => ({
                ...combination,
                [option.name]: optionValue,
            })),
        );
    }

    return combinations.map((optionValues) => {
        const label = options
            .map((option) => optionValues[option.name])
            .join(" / ");

        return { key: label, label, optionValues };
    });
}

export function toProductVariants(value: ProductAddFormValue): ProductVariantCreateInput[] {
    return toVariantDrafts(value).map((draft) => ({
        price: value.variantPrices[draft.key] ?? value.basePrice,
        skuCode: value.variantSkuCodes[draft.key]?.trim() || null,
        label: draft.label,
        optionValues: draft.optionValues,
    }));
}

interface ProductAddFormProps {
    value: ProductAddFormValue;
    onChange: (value: ProductAddFormValue) => void;
    onSubmit: () => void;
    onCancel: () => void;
    submitting?: boolean;
    error?: string | null;
    /** Name of the Ware that will be linked when exactly one Variant exists. */
    wareName?: string;
}

export function ProductAddForm({
    value,
    onChange,
    onSubmit,
    onCancel,
    submitting = false,
    error,
    wareName,
}: ProductAddFormProps) {
    const variants = toVariantDrafts(value);

    const updateOption = (index: number, option: ProductOptionDraft) =>
        onChange({
            ...value,
            options: value.options.map((item, itemIndex) =>
                itemIndex === index ? option : item,
            ),
        });

    return (
        <section className="max-h-[90vh] space-y-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    상품 등록
                </h2>
            </div>

            <FormField
                label="상품명"
                value={value.name}
                onChange={(name) => onChange({ ...value, name })}
                placeholder="상품명을 입력하세요."
            />

            <FormField
                label="상품 설명"
                value={value.description}
                onChange={(description) => onChange({ ...value, description })}
                placeholder="상품 설명을 입력하세요."
            />

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                        옵션
                    </span>
                    <button
                        type="button"
                        onClick={() =>
                            onChange({
                                ...value,
                                options: [...value.options, { name: "", values: "" }],
                            })
                        }
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        옵션 추가
                    </button>
                </div>

                {value.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            value={option.name}
                            onChange={(e) => updateOption(index, { ...option, name: e.target.value })}
                            placeholder="옵션명 (예: Color)"
                            className="w-1/3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={option.values}
                            onChange={(e) => updateOption(index, { ...option, values: e.target.value })}
                            placeholder="값을 쉼표로 구분 (예: Black, White)"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                onChange({
                                    ...value,
                                    options: value.options.filter((_, itemIndex) => itemIndex !== index),
                                })
                            }
                            className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-600"
                        >
                            삭제
                        </button>
                    </div>
                ))}
            </div>

            <FormField
                label="기본 가격 (Variant 기본값)"
                value={String(value.basePrice)}
                onChange={(price) => onChange({ ...value, basePrice: Number(price) })}
                placeholder="0"
                type="number"
                min={0}
                step={1}
            />

            <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600">
                    Variant ({variants.length})
                </span>

                {variants.map((variant) => (
                    <div key={variant.key} className="flex items-center gap-2">
                        <span className="w-1/3 truncate text-sm text-slate-700">
                            {variant.label ?? "기본"}
                        </span>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            value={String(value.variantPrices[variant.key] ?? value.basePrice)}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    variantPrices: {
                                        ...value.variantPrices,
                                        [variant.key]: Number(e.target.value),
                                    },
                                })
                            }
                            className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={value.variantSkuCodes[variant.key] ?? ""}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    variantSkuCodes: {
                                        ...value.variantSkuCodes,
                                        [variant.key]: e.target.value,
                                    },
                                })
                            }
                            placeholder="SKU (선택)"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                    </div>
                ))}

                {wareName && (
                    <p className="text-xs text-slate-400">
                        {variants.length === 1
                            ? `선택한 Ware(${wareName})가 이 Variant에 연결됩니다.`
                            : "Variant가 여러 개이면 Ware는 연결되지 않습니다. 재고 관리에서 Variant별로 연결하세요."}
                    </p>
                )}
            </div>

            {error && (
                <p className="text-sm text-rose-600">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    취소
                </button>

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                    {submitting ? "등록 중..." : "확인"}
                </button>
            </div>
        </section>
    );
}
