// apps/user-web/component/design/main/product/AdminProductSection.tsx

"use client";

import type {
    ProductCardData,
    ProductSectionConfig,
} from "@mall/mall-page-viewer";

interface AdminProductSectionProps {
    section: ProductSectionConfig;

    onChange: (
        section: ProductSectionConfig,
    ) => void;

    onDelete?: () => void;
}

const layoutOptions: {
    value: ProductSectionConfig["layout"];
    label: string;
}[] = [
        {
            value: "GRID",
            label: "Grid",
        },
        {
            value: "HORIZONTAL_SCROLL",
            label: "가로 스크롤",
        },
        {
            value: "LARGE",
            label: "Large",
        },
    ];

const cardTypeOptions: {
    value: ProductSectionConfig["cardType"];
    label: string;
}[] = [
        {
            value: "NO_DISCOUNT",
            label: "일반",
        },
        {
            value: "DISCOUNT",
            label: "할인",
        },
        {
            value: "DETAILED",
            label: "상세",
        },
    ];

export default function AdminProductSection({
    section,
    onChange,
    onDelete,
}: AdminProductSectionProps) {
    const updateSection = (
        updates: Partial<ProductSectionConfig>,
    ) => {
        onChange({
            ...section,
            ...updates,
        });
    };

    const removeProduct = (
        productId: string,
    ) => {
        updateSection({
            products: section.products.filter(
                (product) =>
                    product.id !== productId,
            ),
        });
    };

    const moveProduct = (
        fromIndex: number,
        toIndex: number,
    ) => {
        if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >=
            section.products.length ||
            toIndex >=
            section.products.length
        ) {
            return;
        }

        const products = [
            ...section.products,
        ];

        const [moved] =
            products.splice(
                fromIndex,
                1,
            );

        if (!moved) {
            return;
        }

        products.splice(
            toIndex,
            0,
            moved,
        );

        updateSection({
            products,
        });
    };

    const addMockProduct = () => {
        const product: ProductCardData = {
            id: crypto.randomUUID(),
            imageUrl: "",
            title: "새 상품",
            summary: "",
            price: 0,
            discount: 0,
            tags: [],
        };

        updateSection({
            products: [
                ...section.products,
                product,
            ],
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Product
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        상품 Section의 구성과 노출 상품을 관리합니다.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={
                            section.isActive
                                ? "text-sm text-emerald-600"
                                : "text-sm text-slate-400"
                        }
                    >
                        {section.isActive
                            ? "활성"
                            : "비활성"}
                    </span>

                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="text-xs text-rose-500 transition-colors hover:text-rose-700"
                        >
                            삭제
                        </button>
                    )}
                </div>
            </div>

            {/* Section Settings */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {/* Title */}
                <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                        Section 제목
                    </label>

                    <input
                        type="text"
                        value={section.title}
                        onChange={(event) =>
                            updateSection({
                                title:
                                    event.target
                                        .value,
                            })
                        }
                        placeholder="상품 Section 제목"
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                {/* Layout */}
                <div>
                    <label className="text-sm font-medium text-slate-700">
                        Layout
                    </label>

                    <select
                        value={section.layout}
                        onChange={(event) =>
                            updateSection({
                                layout:
                                    event.target
                                        .value as ProductSectionConfig["layout"],
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    >
                        {layoutOptions.map(
                            (option) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* Card Type */}
                <div>
                    <label className="text-sm font-medium text-slate-700">
                        Card Type
                    </label>

                    <select
                        value={section.cardType}
                        onChange={(event) =>
                            updateSection({
                                cardType:
                                    event.target
                                        .value as ProductSectionConfig["cardType"],
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    >
                        {cardTypeOptions.map(
                            (option) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            ),
                        )}
                    </select>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 sm:col-span-2">
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            Section 노출
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            비활성화하면 Client에 표시되지 않습니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            updateSection({
                                isActive:
                                    !section.isActive,
                            })
                        }
                        className={
                            section.isActive
                                ? "relative h-6 w-11 rounded-full bg-slate-900"
                                : "relative h-6 w-11 rounded-full bg-slate-300"
                        }
                        aria-label="Product Section 노출 상태 변경"
                    >
                        <span
                            className={
                                section.isActive
                                    ? "absolute left-6 top-1 h-4 w-4 rounded-full bg-white"
                                    : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white"
                            }
                        />
                    </button>
                </div>
            </div>

            {/* Products */}
            <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                            상품
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                            이 Section에 표시할 상품을 관리합니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addMockProduct}
                        className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                    >
                        상품 추가
                    </button>
                </div>

                <div className="mt-4 space-y-2">
                    {section.products.map(
                        (product, index) => (
                            <div
                                key={product.id}
                                className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                            >
                                {/* Order */}
                                <span className="w-6 text-center text-xs text-slate-400">
                                    {index + 1}
                                </span>

                                {/* Image */}
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                    {product.imageUrl ? (
                                        <img
                                            src={
                                                product.imageUrl
                                            }
                                            alt={
                                                product.title
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                                            없음
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-700">
                                        {
                                            product.title
                                        }
                                    </p>

                                    {typeof product.price === "number" && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            {product.price.toLocaleString()}
                                            원
                                        </p>
                                    )}
                                </div>

                                {/* Order */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={
                                            index ===
                                            0
                                        }
                                        onClick={() =>
                                            moveProduct(
                                                index,
                                                index -
                                                1,
                                            )
                                        }
                                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        ↑
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            index ===
                                            section
                                                .products
                                                .length -
                                            1
                                        }
                                        onClick={() =>
                                            moveProduct(
                                                index,
                                                index +
                                                1,
                                            )
                                        }
                                        className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        ↓
                                    </button>
                                </div>

                                {/* Delete */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeProduct(
                                            product.id,
                                        )
                                    }
                                    className="text-xs text-rose-500 transition-colors hover:text-rose-700"
                                >
                                    삭제
                                </button>
                            </div>
                        ),
                    )}

                    {section.products.length ===
                        0 && (
                            <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-xs text-slate-400">
                                등록된 상품이 없습니다.
                            </div>
                        )}
                </div>
            </div>
        </section>
    );
}