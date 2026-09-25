"use client";

import { useEffect, useRef, useState } from "react";
import type {
    AdminProductDetail,
    Product,
    ProductUpdateInput,
} from "@mall/types";

import { useAdminProducts } from "@/hooks/products/useAdminProducts";
import { useImageApi } from "@/hooks/images/useImageApi";

import { ProductImagesField, type ProductImageItem } from "./ProductImagesField";

interface ProductEditModalProps {
    productId: string;
    onSaved: (product: Product) => void;
    onClose: () => void;
}

/** Client-side draft. `key` is the persisted id, or a local key for new rows. */
interface ValueDraft {
    key: string;
    id?: string;
    value: string;
    isActive: boolean;
}

interface OptionDraft {
    key: string;
    id?: string;
    name: string;
    isRequired: boolean;
    values: ValueDraft[];
}

interface VariantDraft {
    key: string;
    id?: string;
    skuCode: string;
    label: string;
    price: number;
    isActive: boolean;
    /** optionKey -> valueKey */
    combo: Record<string, string>;
    comboChanged: boolean;
}

interface ProductDraft {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    images: ProductImageItem[];
    options: OptionDraft[];
    variants: VariantDraft[];
}

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm";
const smallButton = "rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50";

function toDraft(detail: AdminProductDetail): ProductDraft {
    const optionOfValue = new Map<string, string>();
    detail.options.forEach((option) =>
        option.values.forEach((value) => optionOfValue.set(value.id, option.id)),
    );

    return {
        id: detail.id,
        name: detail.name,
        description: detail.description ?? "",
        isActive: detail.isActive,
        images: detail.imageUrls.map((url) => ({ url })),
        options: detail.options.map((option) => ({
            key: option.id,
            id: option.id,
            name: option.name,
            isRequired: option.isRequired,
            values: option.values.map((value) => ({
                key: value.id,
                id: value.id,
                value: value.value,
                isActive: value.isActive,
            })),
        })),
        variants: detail.variants.map((variant) => ({
            key: variant.id,
            id: variant.id,
            skuCode: variant.skuCode ?? "",
            label: variant.label ?? "",
            price: variant.price,
            isActive: variant.isActive,
            combo: Object.fromEntries(
                variant.optionValueIds
                    .filter((valueId) => optionOfValue.has(valueId))
                    .map((valueId) => [optionOfValue.get(valueId)!, valueId]),
            ),
            comboChanged: false,
        })),
    };
}

/** Maps a local combination to the RPC's `{ optionName: value }` form. */
function toOptionValues(draft: ProductDraft, combo: Record<string, string>) {
    const result: Record<string, string> = {};

    for (const option of draft.options) {
        const value = option.values.find((item) => item.key === combo[option.key]);

        if (value) {
            result[option.name.trim()] = value.value.trim();
        }
    }

    return result;
}

function toUpdateInput(draft: ProductDraft, imageUrls: string[]): ProductUpdateInput {
    return {
        product: {
            name: draft.name.trim(),
            description: draft.description.trim() || null,
            isActive: draft.isActive,
            imageUrls,
        },
        options: draft.options.map((option) => ({
            ...(option.id ? { id: option.id } : {}),
            name: option.name.trim(),
            isRequired: option.isRequired,
            values: option.values.map((value) =>
                value.id
                    ? { id: value.id, value: value.value.trim(), isActive: value.isActive }
                    : { value: value.value.trim(), isActive: value.isActive },
            ),
        })),
        variants: draft.variants.map((variant) => ({
            ...(variant.id ? { id: variant.id } : {}),
            skuCode: variant.skuCode.trim() || null,
            label: variant.label.trim() || null,
            price: variant.price,
            isActive: variant.isActive,
            ...(!variant.id || variant.comboChanged
                ? { optionValues: toOptionValues(draft, variant.combo) }
                : {}),
        })),
    };
}

/**
 * Edits a persisted Product through admin_update_product() in one
 * transaction: info, Options/Values (incl. new ones), Variants (incl. new
 * ones and combination changes). Deletion is not supported.
 */
export function ProductEditModal({ productId, onSaved, onClose }: ProductEditModalProps) {
    const { fetchProductDetail, updateProduct } = useAdminProducts();
    const { uploadProductImages } = useImageApi();
    const [draft, setDraft] = useState<ProductDraft | null>(null);
    const [newValueText, setNewValueText] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const localKey = useRef(0);
    const nextKey = () => `new-${++localKey.current}`;

    useEffect(() => {
        let cancelled = false;

        fetchProductDetail(productId)
            .then((detail) => {
                if (!cancelled) setDraft(toDraft(detail));
            })
            .catch((cause) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다.");
            });

        return () => {
            cancelled = true;
        };
    }, [fetchProductDetail, productId]);

    const patchDraft = (patch: (current: ProductDraft) => ProductDraft) =>
        setDraft((current) => (current ? patch(current) : current));

    const updateOption = (optionKey: string, patch: Partial<OptionDraft>) =>
        patchDraft((current) => ({
            ...current,
            options: current.options.map((option) =>
                option.key === optionKey ? { ...option, ...patch } : option,
            ),
        }));

    const updateValue = (optionKey: string, valueKey: string, patch: Partial<ValueDraft>) =>
        patchDraft((current) => ({
            ...current,
            options: current.options.map((option) =>
                option.key !== optionKey
                    ? option
                    : {
                        ...option,
                        values: option.values.map((value) =>
                            value.key === valueKey ? { ...value, ...patch } : value,
                        ),
                    },
            ),
        }));

    const addValue = (optionKey: string) => {
        const text = (newValueText[optionKey] ?? "").trim();

        if (!text) return;

        patchDraft((current) => ({
            ...current,
            options: current.options.map((option) =>
                option.key !== optionKey
                    ? option
                    : { ...option, values: [...option.values, { key: nextKey(), value: text, isActive: true }] },
            ),
        }));
        setNewValueText({ ...newValueText, [optionKey]: "" });
    };

    const updateVariant = (variantKey: string, patch: Partial<VariantDraft>) =>
        patchDraft((current) => ({
            ...current,
            variants: current.variants.map((variant) =>
                variant.key === variantKey ? { ...variant, ...patch } : variant,
            ),
        }));

    const selectVariantValue = (variant: VariantDraft, optionKey: string, valueKey: string) => {
        const combo = { ...variant.combo };

        if (valueKey) {
            combo[optionKey] = valueKey;
        } else {
            delete combo[optionKey];
        }

        updateVariant(variant.key, { combo, comboChanged: true });
    };

    const handleSave = async () => {
        if (!draft) return;

        if (!draft.name.trim()) {
            setError("상품명을 입력하세요.");
            return;
        }

        if (draft.options.some((option) => !option.name.trim() || option.values.length === 0)) {
            setError("옵션명과 최소 1개의 옵션 값이 필요합니다.");
            return;
        }

        if (draft.variants.some((variant) => !Number.isFinite(variant.price) || variant.price < 0)) {
            setError("Variant 가격은 0 이상이어야 합니다.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Pending images are uploaded first; if any upload fails the
            // Product (including image_urls) is not updated.
            const imageUrls = await uploadProductImages(draft.images);
            onSaved(await updateProduct(draft.id, toUpdateInput(draft, imageUrls)));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "상품 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <section className="max-h-[90vh] w-full max-w-4xl space-y-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">상품 수정</h2>

                {!draft ? (
                    <p className="py-8 text-center text-sm text-slate-400">
                        {error ?? "불러오는 중..."}
                    </p>
                ) : (
                    <>
                        <div className="grid gap-3">
                            <input
                                value={draft.name}
                                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                                placeholder="상품명"
                                className={inputClass}
                            />
                            <input
                                value={draft.description}
                                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                                placeholder="상품 설명"
                                className={inputClass}
                            />
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={draft.isActive}
                                    onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                                />
                                판매 활성
                            </label>
                        </div>

                        <ProductImagesField
                            value={draft.images}
                            onChange={(images) => patchDraft((current) => ({ ...current, images }))}
                            disabled={saving}
                        />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-slate-600">옵션</h3>
                                <button
                                    type="button"
                                    className={smallButton}
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            options: [...draft.options, { key: nextKey(), name: "", isRequired: true, values: [] }],
                                        })
                                    }
                                >
                                    옵션 추가
                                </button>
                            </div>

                            {draft.options.map((option) => (
                                <div key={option.key} className="space-y-2 rounded-lg border border-slate-100 p-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={option.name}
                                            onChange={(event) => updateOption(option.key, { name: event.target.value })}
                                            placeholder="옵션명"
                                            className={`${inputClass} flex-1`}
                                        />
                                        <label className="flex items-center gap-1 text-xs text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={option.isRequired}
                                                onChange={(event) => updateOption(option.key, { isRequired: event.target.checked })}
                                            />
                                            필수
                                        </label>
                                    </div>

                                    {option.values.map((value) => (
                                        <div key={value.key} className="flex items-center gap-2 pl-4">
                                            <input
                                                value={value.value}
                                                onChange={(event) => updateValue(option.key, value.key, { value: event.target.value })}
                                                className={`${inputClass} flex-1`}
                                            />
                                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={value.isActive}
                                                    onChange={(event) => updateValue(option.key, value.key, { isActive: event.target.checked })}
                                                />
                                                활성
                                            </label>
                                        </div>
                                    ))}

                                    <div className="flex items-center gap-2 pl-4">
                                        <input
                                            value={newValueText[option.key] ?? ""}
                                            onChange={(event) => setNewValueText({ ...newValueText, [option.key]: event.target.value })}
                                            placeholder="새 옵션 값"
                                            className={`${inputClass} flex-1`}
                                        />
                                        <button type="button" className={smallButton} onClick={() => addValue(option.key)}>
                                            값 추가
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <p className="text-xs text-slate-400">
                                활성 Variant가 사용하는 옵션 값은 비활성화할 수 없습니다. 먼저 Variant를 비활성화하거나 조합을 변경하세요. 삭제는 지원하지 않습니다.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-slate-600">Variant</h3>
                                <button
                                    type="button"
                                    className={smallButton}
                                    onClick={() =>
                                        setDraft({
                                            ...draft,
                                            variants: [
                                                ...draft.variants,
                                                {
                                                    key: nextKey(),
                                                    skuCode: "",
                                                    label: "",
                                                    price: 0,
                                                    isActive: true,
                                                    combo: {},
                                                    comboChanged: true,
                                                },
                                            ],
                                        })
                                    }
                                >
                                    Variant 추가
                                </button>
                            </div>

                            {draft.variants.map((variant) => (
                                <div key={variant.key} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 p-2">
                                    {draft.options.map((option) => (
                                        <select
                                            key={option.key}
                                            value={variant.combo[option.key] ?? ""}
                                            onChange={(event) => selectVariantValue(variant, option.key, event.target.value)}
                                            className={`${inputClass} w-32`}
                                        >
                                            <option value="">{option.name || "옵션"}: 선택 안 함</option>
                                            {option.values.map((value) => (
                                                <option key={value.key} value={value.key}>
                                                    {value.value}{value.isActive ? "" : " (비활성)"}
                                                </option>
                                            ))}
                                        </select>
                                    ))}
                                    <input
                                        value={variant.label}
                                        onChange={(event) => updateVariant(variant.key, { label: event.target.value })}
                                        placeholder="표시명"
                                        className={`${inputClass} w-28`}
                                    />
                                    <input
                                        value={variant.skuCode}
                                        onChange={(event) => updateVariant(variant.key, { skuCode: event.target.value })}
                                        placeholder="SKU"
                                        className={`${inputClass} w-28`}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={String(variant.price)}
                                        onChange={(event) => updateVariant(variant.key, { price: Number(event.target.value) })}
                                        className={`${inputClass} w-24`}
                                    />
                                    <label className="flex items-center gap-1 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={variant.isActive}
                                            onChange={(event) => updateVariant(variant.key, { isActive: event.target.checked })}
                                        />
                                        활성
                                    </label>
                                    {!variant.id && <span className="text-xs text-blue-600">신규</span>}
                                </div>
                            ))}
                        </div>

                        {error && <p className="text-sm text-rose-600">{error}</p>}
                    </>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!draft || saving}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? "저장 중..." : "저장"}
                    </button>
                </div>
            </section>
        </div>
    );
}
