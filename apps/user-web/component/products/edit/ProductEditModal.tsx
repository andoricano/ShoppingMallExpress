"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminProductDetail, Product } from "@mall/types";

import { useAdminProducts } from "@/hooks/products/useAdminProducts";

interface ProductEditModalProps {
    productId: string;
    onSaved: (product: Product) => void;
    onClose: () => void;
}

const inputClass = "rounded-lg border border-slate-200 px-3 py-2 text-sm";

/**
 * Edits a persisted Product, its Options/Values and Variant sku/price/active
 * state through admin_update_product() (one transaction).
 */
export function ProductEditModal({ productId, onSaved, onClose }: ProductEditModalProps) {
    const { fetchProductDetail, updateProduct } = useAdminProducts();
    const [draft, setDraft] = useState<AdminProductDetail | null>(null);
    const [newValues, setNewValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetchProductDetail(productId)
            .then((detail) => {
                if (!cancelled) setDraft(detail);
            })
            .catch((cause) => {
                if (!cancelled) setError(cause instanceof Error ? cause.message : "상품을 불러오지 못했습니다.");
            });

        return () => {
            cancelled = true;
        };
    }, [fetchProductDetail, productId]);

    const valueLabels = useMemo(() => {
        const labels = new Map<string, string>();
        draft?.options.forEach((option) =>
            option.values.forEach((value) => labels.set(value.id, value.value)),
        );
        return labels;
    }, [draft]);

    const updateOption = (optionId: string, patch: Partial<AdminProductDetail["options"][number]>) =>
        setDraft((current) => current && {
            ...current,
            options: current.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option,
            ),
        });

    const updateValue = (optionId: string, valueId: string, patch: { value?: string; isActive?: boolean }) =>
        setDraft((current) => current && {
            ...current,
            options: current.options.map((option) =>
                option.id !== optionId
                    ? option
                    : {
                        ...option,
                        values: option.values.map((value) =>
                            value.id === valueId ? { ...value, ...patch } : value,
                        ),
                    },
            ),
        });

    const updateVariant = (variantId: string, patch: Partial<AdminProductDetail["variants"][number]>) =>
        setDraft((current) => current && {
            ...current,
            variants: current.variants.map((variant) =>
                variant.id === variantId ? { ...variant, ...patch } : variant,
            ),
        });

    const handleSave = async () => {
        if (!draft) return;

        if (!draft.name.trim()) {
            setError("상품명을 입력하세요.");
            return;
        }

        if (draft.variants.some((variant) => !Number.isFinite(variant.price) || variant.price < 0)) {
            setError("Variant 가격은 0 이상이어야 합니다.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const saved = await updateProduct(draft.id, {
                product: {
                    name: draft.name.trim(),
                    description: draft.description?.trim() || null,
                    isActive: draft.isActive,
                },
                options: draft.options.map((option) => ({
                    id: option.id,
                    name: option.name.trim(),
                    isRequired: option.isRequired,
                    values: [
                        ...option.values.map((value) => ({
                            id: value.id,
                            value: value.value.trim(),
                            isActive: value.isActive,
                        })),
                        ...Array.from(new Set(
                            (newValues[option.id] ?? "")
                                .split(",")
                                .map((value) => value.trim())
                                .filter(Boolean),
                        )).map((value) => ({ value })),
                    ],
                })),
                variants: draft.variants.map((variant) => ({
                    id: variant.id,
                    skuCode: variant.skuCode?.trim() || null,
                    label: variant.label?.trim() || null,
                    price: variant.price,
                    isActive: variant.isActive,
                })),
            });

            onSaved(saved);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "상품 저장에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <section className="max-h-[90vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
                                value={draft.description ?? ""}
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

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-slate-600">옵션</h3>
                            {draft.options.length === 0 && (
                                <p className="text-xs text-slate-400">옵션이 없는 상품입니다.</p>
                            )}
                            {draft.options.map((option) => (
                                <div key={option.id} className="space-y-2 rounded-lg border border-slate-100 p-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={option.name}
                                            onChange={(event) => updateOption(option.id, { name: event.target.value })}
                                            className={`${inputClass} flex-1`}
                                        />
                                        <label className="flex items-center gap-1 text-xs text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={option.isRequired}
                                                onChange={(event) => updateOption(option.id, { isRequired: event.target.checked })}
                                            />
                                            필수
                                        </label>
                                    </div>
                                    {option.values.map((value) => (
                                        <div key={value.id} className="flex items-center gap-2 pl-4">
                                            <input
                                                value={value.value}
                                                onChange={(event) => updateValue(option.id, value.id, { value: event.target.value })}
                                                className={`${inputClass} flex-1`}
                                            />
                                            <label className="flex items-center gap-1 text-xs text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={value.isActive}
                                                    onChange={(event) => updateValue(option.id, value.id, { isActive: event.target.checked })}
                                                />
                                                활성
                                            </label>
                                        </div>
                                    ))}
                                    <input
                                        value={newValues[option.id] ?? ""}
                                        onChange={(event) => setNewValues({ ...newValues, [option.id]: event.target.value })}
                                        placeholder="새 값 추가 (쉼표로 구분)"
                                        className={`${inputClass} ml-4 w-[calc(100%-1rem)]`}
                                    />
                                </div>
                            ))}
                            <p className="text-xs text-slate-400">
                                새 값에 대한 Variant 생성과 옵션 추가/삭제는 아직 지원하지 않습니다.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-slate-600">Variant</h3>
                            {draft.variants.map((variant) => (
                                <div key={variant.id} className="flex flex-wrap items-center gap-2">
                                    <span className="w-40 truncate text-sm text-slate-700">
                                        {variant.optionValueIds.map((id) => valueLabels.get(id) ?? "?").join(" / ") || "기본"}
                                    </span>
                                    <input
                                        value={variant.label ?? ""}
                                        onChange={(event) => updateVariant(variant.id, { label: event.target.value })}
                                        placeholder="표시명"
                                        className={`${inputClass} w-32`}
                                    />
                                    <input
                                        value={variant.skuCode ?? ""}
                                        onChange={(event) => updateVariant(variant.id, { skuCode: event.target.value })}
                                        placeholder="SKU"
                                        className={`${inputClass} w-32`}
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={String(variant.price)}
                                        onChange={(event) => updateVariant(variant.id, { price: Number(event.target.value) })}
                                        className={`${inputClass} w-28`}
                                    />
                                    <label className="flex items-center gap-1 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={variant.isActive}
                                            onChange={(event) => updateVariant(variant.id, { isActive: event.target.checked })}
                                        />
                                        활성
                                    </label>
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
