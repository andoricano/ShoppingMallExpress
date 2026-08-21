// @/components/product/ProductInputForm.tsx
"use client";

import { 
    CreateProductPayload,
    DiscountType,
    InventoryItem,
    ProductCategory,
    ProductStatus, } from "@mall/types";

import { useEffect, useState } from "react";

interface ProductInputFormProps {
    selectedSku: InventoryItem | null;
    categoryList?: ProductCategory[];
    onCreateProduct: (payload: CreateProductPayload) => Promise<boolean>;
}

export function ProductInputForm({
    selectedSku,
    categoryList = [],
    onCreateProduct,
}: ProductInputFormProps) {
    // 폼 입력 상태
    const [productName, setProductName] = useState("");
    const [mainImageUrl, setMainImageUrl] = useState("");
    const [subImageUrlsText, setSubImageUrlsText] = useState(""); // 쉼표 구분 문자열
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<Extract<ProductStatus, "DISPLAY" | "HIDDEN">>("DISPLAY");
    const [sortOrder, setSortOrder] = useState<number>(0);
    const [basePrice, setBasePrice] = useState<number>(0);
    const [discountType, setDiscountType] = useState<DiscountType | "NONE">("NONE");
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [discountStartDate, setDiscountStartDate] = useState("");
    const [discountEndDate, setDiscountEndDate] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    // 옵션 정보 (기본적으로 선택된 SKU와 연결)
    const [optionName, setOptionName] = useState("기본");
    const [optionValue, setOptionValue] = useState("단품");
    const [surcharge, setSurcharge] = useState<number>(0);

    const [submitting, setSubmitting] = useState(false);

    // 선택된 SKU 변경 시 기본값 세팅
    useEffect(() => {
        if (selectedSku) {
            if (selectedSku.productName) {
                setProductName(selectedSku.productName);
            }
        }
    }, [selectedSku]);

    // 카테고리 체크박스 토글
    const handleCategoryToggle = (categoryId: string) => {
        setSelectedCategoryIds((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSku) {
            alert("선택된 SKU(재고) 정보가 없습니다. 먼저 SKU를 선택해주세요.");
            return;
        }

        if (!productName.trim()) {
            alert("상품명을 입력해주세요.");
            return;
        }

        if (selectedCategoryIds.length === 0) {
            alert("최소 하나 이상의 카테고리를 선택해주세요.");
            return;
        }

        setSubmitting(true);

        const subImageUrls = subImageUrlsText
            .split(",")
            .map((url) => url.trim())
            .filter(Boolean);

        const payload: CreateProductPayload = {
            productName,
            mainImageUrl,
            subImageUrls: subImageUrls.length > 0 ? subImageUrls : undefined,
            description,
            status,
            sortOrder,
            basePrice,
            discountType: discountType === "NONE" ? undefined : discountType,
            discountValue: discountType === "NONE" ? undefined : discountValue,
            discountStartDate: discountStartDate || undefined,
            discountEndDate: discountEndDate || undefined,
            options: [
                {
                    optionName,
                    optionValue,
                    surcharge,
                    skuId: selectedSku.skuId, // 선택된 SKU ID 자동 매핑
                },
            ],
            categoryIds: selectedCategoryIds,
        };

        const success = await onCreateProduct(payload);

        if (success) {
            alert("상품이 성공적으로 등록되었습니다.");
            // 폼 초기화
            setProductName("");
            setMainImageUrl("");
            setSubImageUrlsText("");
            setDescription("");
            setStatus("DISPLAY");
            setSortOrder(0);
            setBasePrice(0);
            setDiscountType("NONE");
            setDiscountValue(0);
            setDiscountStartDate("");
            setDiscountEndDate("");
            setSelectedCategoryIds([]);
            setOptionName("기본");
            setOptionValue("단품");
            setSurcharge(0);
        }

        setSubmitting(false);
    };

    return (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
            <h3 className="text-md font-semibold text-white border-b border-zinc-800 pb-3">
                상품 정보 입력 (Product Input)
            </h3>

            {/* 선택된 SKU 정보 요약 */}
            <div className="p-3 rounded bg-zinc-800/60 border border-zinc-700/60 flex flex-col gap-1 text-xs">
                <span className="text-zinc-400 font-medium">연결된 원천 SKU</span>
                {selectedSku ? (
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-blue-400 font-bold">
                            {selectedSku.skuId}
                        </span>
                        <span className="text-zinc-300">
                            {selectedSku.productName || "상품명 없음"} (재고: {selectedSku.currentStock ?? 0}개)
                        </span>
                    </div>
                ) : (
                    <span className="text-zinc-500 italic">
                        선택된 SKU가 없습니다. 상단/좌측 테이블에서 선택해주세요.
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
                {/* 1. 기본 정보 */}
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-zinc-300 block mb-1 font-medium">
                            상품명 <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="상품명을 입력하세요"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-zinc-300 block mb-1 font-medium">진열 상태</label>
                            <select
                                value={status}
                                onChange={(e) =>
                                    setStatus(e.target.value as Extract<ProductStatus, "DISPLAY" | "HIDDEN">)
                                }
                                className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            >
                                <option value="DISPLAY">진열 (DISPLAY)</option>
                                <option value="HIDDEN">숨김 (HIDDEN)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-zinc-300 block mb-1 font-medium">진열 우선순위 (sortOrder)</label>
                            <input
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(Number(e.target.value))}
                                className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. 이미지 설정 */}
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-zinc-300 block mb-1 font-medium">대표 이미지 URL</label>
                        <input
                            type="text"
                            placeholder="https://example.com/main.jpg"
                            value={mainImageUrl}
                            onChange={(e) => setMainImageUrl(e.target.value)}
                            className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                        />
                    </div>

                    <div>
                        <label className="text-zinc-300 block mb-1 font-medium">
                            서브 이미지 URL 목록 (쉼표로 구분)
                        </label>
                        <input
                            type="text"
                            placeholder="https://example.com/sub1.jpg, https://example.com/sub2.jpg"
                            value={subImageUrlsText}
                            onChange={(e) => setSubImageUrlsText(e.target.value)}
                            className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                        />
                    </div>
                </div>

                {/* 3. 가격 및 할인 설정 */}
                <div className="p-3 rounded bg-zinc-800/40 border border-zinc-800 flex flex-col gap-3">
                    <span className="text-zinc-300 font-semibold">가격 및 할인 정책</span>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-zinc-400 block mb-1">정상가 (basePrice)</label>
                            <input
                                type="number"
                                min={0}
                                value={basePrice}
                                onChange={(e) => setBasePrice(Number(e.target.value))}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 block mb-1">할인 유형</label>
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value as DiscountType | "NONE")}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            >
                                <option value="NONE">할인 없음</option>
                                <option value="FIXED_AMOUNT">정액 할인 (FIXED_AMOUNT)</option>
                                <option value="PERCENTAGE">정률 할인 (PERCENTAGE)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-zinc-400 block mb-1">할인값</label>
                            <input
                                type="number"
                                min={0}
                                disabled={discountType === "NONE"}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white disabled:opacity-40 focus:outline-none"
                            />
                        </div>
                    </div>

                    {discountType !== "NONE" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-zinc-400 block mb-1">할인 시작일시</label>
                                <input
                                    type="datetime-local"
                                    value={discountStartDate}
                                    onChange={(e) => setDiscountStartDate(e.target.value)}
                                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-zinc-400 block mb-1">할인 종료일시</label>
                                <input
                                    type="datetime-local"
                                    value={discountEndDate}
                                    onChange={(e) => setDiscountEndDate(e.target.value)}
                                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. 옵션 설정 */}
                <div className="p-3 rounded bg-zinc-800/40 border border-zinc-800 flex flex-col gap-3">
                    <span className="text-zinc-300 font-semibold">옵션 매핑 (ProductOption)</span>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-zinc-400 block mb-1">옵션명</label>
                            <input
                                type="text"
                                value={optionName}
                                onChange={(e) => setOptionName(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 block mb-1">옵션값</label>
                            <input
                                type="text"
                                value={optionValue}
                                onChange={(e) => setOptionValue(e.target.value)}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-zinc-400 block mb-1">추가금액 (surcharge)</label>
                            <input
                                type="number"
                                value={surcharge}
                                onChange={(e) => setSurcharge(Number(e.target.value))}
                                className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 5. 카테고리 매핑 */}
                <div>
                    <label className="text-zinc-300 block mb-1 font-medium">
                        카테고리 선택 <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2.5 rounded bg-zinc-800 border border-zinc-700">
                        {categoryList.length === 0 ? (
                            <span className="text-zinc-500">등록된 카테고리가 없습니다.</span>
                        ) : (
                            categoryList.map((cat) => {
                                const isChecked = selectedCategoryIds.includes(cat.categoryId);
                                return (
                                    <label
                                        key={cat.categoryId}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer border text-xs transition-colors ${
                                            isChecked
                                                ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                                : "bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleCategoryToggle(cat.categoryId)}
                                            className="hidden"
                                        />
                                        <span>{cat.categoryName}</span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 6. 상품 설명 */}
                <div>
                    <label className="text-zinc-300 block mb-1 font-medium">상품 설명</label>
                    <textarea
                        rows={3}
                        placeholder="상품에 대한 구체적인 설명을 입력하세요"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2.5 rounded bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
                    />
                </div>

                {/* 제출 버튼 */}
                <button
                    type="submit"
                    disabled={submitting || !selectedSku}
                    className="mt-2 w-full p-3 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-semibold text-white transition-colors text-xs"
                >
                    {submitting ? "등록 중..." : "상품 신규 생성"}
                </button>
            </form>
        </div>
    );
}