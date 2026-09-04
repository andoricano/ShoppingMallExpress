// component/products/add/ProductAddForm.tsx

"use client";

import type { Product } from "@mall/types";

import FormField from "@/component/common/field/FormField";

export interface ProductAddFormValue {
    name: string;
    price: number;
    description: string;
}

interface ProductAddFormProps {
    value: ProductAddFormValue;
    onChange: (value: ProductAddFormValue) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

export function ProductAddForm({
    value,
    onChange,
    onSubmit,
    onCancel,
}: ProductAddFormProps) {
    return (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                    상품 등록
                </h2>
            </div>

            <FormField
                label="상품명"
                value={value.name}
                onChange={(name) =>
                    onChange({
                        ...value,
                        name,
                    })
                }
                placeholder="상품명을 입력하세요."
            />

            <FormField
                label="가격"
                value={String(value.price)}
                onChange={(price) =>
                    onChange({
                        ...value,
                        price: Number(price),
                    })
                }
                placeholder="0"
                type="number"
                min={0}
                step={1}
            />

            <FormField
                label="상품 메모"
                value={value.description}
                onChange={(description) =>
                    onChange({
                        ...value,
                        description,
                    })
                }
                placeholder="상품에 대한 메모를 남기세요."
            />

            <div className="flex items-center justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    취소
                </button>

                <button
                    type="button"
                    onClick={onSubmit}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                    확인
                </button>
            </div>
        </section>
    );
}