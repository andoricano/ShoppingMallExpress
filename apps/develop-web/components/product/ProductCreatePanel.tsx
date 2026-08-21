// @/components/product/ProductCreatePanel.tsx
"use client";


import type { CreateProductPayload, DiscountType, InventoryItem, ProductCategory, ProductStatus } from "@mall/types"; // Inventory 모듈의 SKU 타입
import { useState } from "react";

interface ProductCreatePanelProps {
    inventoryList: InventoryItem[]; // Inventory 모듈에서 불러온 원천 SKU 목록
    categoryList?: ProductCategory[]; // 선택 가능한 카테고리 목록
    onCreateProduct: (payload: CreateProductPayload) => Promise<boolean>;
}

interface DynamicOptionInput {
    id: string; // React key용 고유 ID
    optionName: string;
    optionValue: string;
    surcharge: number;
    skuId: string;
}

export function ProductCreatePanel({
    inventoryList = [],
    categoryList = [],
    onCreateProduct,
}: ProductCreatePanelProps) {
    const [submitting, setSubmitting] = useState(false);

    // 1. 기본 정보 상태
    const [productName, setProductName] = useState("");
    const [mainImageUrl, setMainImageUrl] = useState("");
    const [subImageUrlsInput, setSubImageUrlsInput] = useState(""); // 쉼표 구분 입력
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<Extract<ProductStatus, "DISPLAY" | "HIDDEN">>("DISPLAY");
    const [sortOrder, setSortOrder] = useState<number>(0);

    // 2. 가격 및 할인 정보 상태
    const [basePrice, setBasePrice] = useState<number>(0);
    const [useDiscount, setUseDiscount] = useState(false);
    const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [discountStartDate, setDiscountStartDate] = useState("");
    const [discountEndDate, setDiscountEndDate] = useState("");

    // 3. 카테고리 선택 상태 (다중 선택)
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    // 4. 동적 옵션 - SKU 매핑 상태
    const [options, setOptions] = useState<DynamicOptionInput[]>([
        {
            id: "opt_init_1",
            optionName: "색상/사이즈",
            optionValue: "기본",
            surcharge: 0,
            skuId: "",
        },
    ]);

    // 옵션 행 추가
    const handleAddOption = () => {
        setOptions((prev) => [
            ...prev,
            {
                id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                optionName: "",
                optionValue: "",
                surcharge: 0,
                skuId: "",
            },
        ]);
    };

    // 옵션 행 삭제
    const handleRemoveOption = (id: string) => {
        if (options.length === 1) {
            alert("최소 1개 이상의 옵션 및 SKU 매핑 정보가 필요합니다.");
            return;
        }
        setOptions((prev) => prev.filter((opt) => opt.id !== id));
    };

    // 옵션 필드 변경
    const handleOptionChange = (
        id: string,
        field: keyof Omit<DynamicOptionInput, "id">,
        value: any
    ) => {
        setOptions((prev) =>
            prev.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
        );
    };

    // 카테고리 체크박스 토글
    const handleCategoryToggle = (categoryId: string, checked: boolean) => {
        if (checked) {
            setSelectedCategoryIds((prev) => [...prev, categoryId]);
        } else {
            setSelectedCategoryIds((prev) => prev.filter((id) => id !== categoryId));
        }
    };

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 필수값 유효성 검증
        if (!productName.trim()) return alert("상품명을 입력해주세요.");
        if (!mainImageUrl.trim()) return alert("메인 이미지 URL을 입력해주세요.");
        if (basePrice <= 0) return alert("정상가는 0원보다 커야 합니다.");

        // 옵션 유효성 검증
        for (let i = 0; i < options.length; i++) {
            const opt = options[i];
            if (!opt.optionName.trim() || !opt.optionValue.trim()) {
                return alert(`${i + 1}번째 옵션의 옵션명과 옵션값을 입력해주세요.`);
            }
            if (!opt.skuId) {
                return alert(`${i + 1}번째 옵션에 매핑할 Inventory SKU를 선택해주세요.`);
            }
        }

        const subImageUrls = subImageUrlsInput
            .split(",")
            .map((url) => url.trim())
            .filter(Boolean);

        const payload: CreateProductPayload = {
            productName: productName.trim(),
            mainImageUrl: mainImageUrl.trim(),
            subImageUrls: subImageUrls.length > 0 ? subImageUrls : undefined,
            description: description.trim(),
            status,
            sortOrder: Number(sortOrder),
            basePrice: Number(basePrice),
            discountType: useDiscount ? discountType : undefined,
            discountValue: useDiscount ? Number(discountValue) : undefined,
            discountStartDate: useDiscount && discountStartDate ? discountStartDate : undefined,
            discountEndDate: useDiscount && discountEndDate ? discountEndDate : undefined,
            options: options.map(({ optionName, optionValue, surcharge, skuId }) => ({
                optionName: optionName.trim(),
                optionValue: optionValue.trim(),
                surcharge: Number(surcharge),
                skuId,
            })),
            categoryIds: selectedCategoryIds,
        };

        setSubmitting(true);
        const success = await onCreateProduct(payload);
        setSubmitting(false);

        if (success) {
            alert("상품이 성공적으로 등록되었습니다.");
            // 폼 초기화
            setProductName("");
            setMainImageUrl("");
            setSubImageUrlsInput("");
            setDescription("");
            setBasePrice(0);
            setUseDiscount(false);
            setDiscountValue(0);
            setSelectedCategoryIds([]);
            setOptions([
                {
                    id: "opt_init_1",
                    optionName: "색상/사이즈",
                    optionValue: "기본",
                    surcharge: 0,
                    skuId: "",
                },
            ]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-xs text-zinc-300">
            {/* 1. 기본 상품 정보 섹션 */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
                    1. 기본 정보
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-zinc-400 mb-1">
                            상품명 <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="예: [특가] 오버핏 레이어드 반팔티"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-400 mb-1">진열 상태 및 우선순위</label>
                        <div className="flex gap-2">
                            <select
                                value={status}
                                onChange={(e) =>
                                    setStatus(e.target.value as Extract<ProductStatus, "DISPLAY" | "HIDDEN">)
                                }
                                className="w-1/2 p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            >
                                <option value="DISPLAY">진열중 (DISPLAY)</option>
                                <option value="HIDDEN">숨김 (HIDDEN)</option>
                            </select>
                            <input
                                type="number"
                                placeholder="우선순위 (기본 0)"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(Number(e.target.value))}
                                className="w-1/2 p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-zinc-400 mb-1">
                            메인 이미지 URL <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="https://example.com/images/main.jpg"
                            value={mainImageUrl}
                            onChange={(e) => setMainImageUrl(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-400 mb-1">
                            서브 이미지 URL (쉼표 , 로 구분)
                        </label>
                        <input
                            type="text"
                            placeholder="https://img1.jpg, https://img2.jpg"
                            value={subImageUrlsInput}
                            onChange={(e) => setSubImageUrlsInput(e.target.value)}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none font-mono"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-zinc-400 mb-1">상품 설명</label>
                    <textarea
                        rows={4}
                        placeholder="상품 상세 설명을 입력하세요 (HTML 또는 Markdown 지원)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* 2. 가격 및 할인 설정 섹션 */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
                    2. 가격 및 할인 설정
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-zinc-400 mb-1">
                            정상가 (원) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            placeholder="20000"
                            value={basePrice || ""}
                            onChange={(e) => setBasePrice(Number(e.target.value))}
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="useDiscount"
                            checked={useDiscount}
                            onChange={(e) => setUseDiscount(e.target.checked)}
                            className="rounded bg-zinc-800 border-zinc-700"
                        />
                        <label htmlFor="useDiscount" className="text-zinc-300 font-medium cursor-pointer">
                            할인 정책 적용하기
                        </label>
                    </div>
                </div>

                {useDiscount && (
                    <div className="p-3 rounded bg-zinc-800/50 border border-zinc-700/60 flex flex-col gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-zinc-400 mb-1">할인 유형</label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                                >
                                    <option value="PERCENTAGE">정률 할인 (%)</option>
                                    <option value="FIXED_AMOUNT">정액 할인 (원)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-zinc-400 mb-1">
                                    할인 값 ({discountType === "PERCENTAGE" ? "%" : "원"})
                                </label>
                                <input
                                    type="number"
                                    placeholder={discountType === "PERCENTAGE" ? "10" : "2000"}
                                    value={discountValue || ""}
                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-zinc-400 mb-1">할인 시작일시</label>
                                <input
                                    type="datetime-local"
                                    value={discountStartDate}
                                    onChange={(e) => setDiscountStartDate(e.target.value)}
                                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 mb-1">할인 종료일시</label>
                                <input
                                    type="datetime-local"
                                    value={discountEndDate}
                                    onChange={(e) => setDiscountEndDate(e.target.value)}
                                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 옵션 구성 및 Inventory SKU 매핑 섹션 (핵심 구역) */}
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            3. 옵션 구성 및 SKU 매핑 <span className="text-rose-500">*</span>
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                            Inventory 모듈에 등록된 원천 SKU를 각 옵션 항목에 매핑해야 합니다.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded font-semibold"
                    >
                        + 옵션 추가
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {options.map((opt, index) => (
                        <div
                            key={opt.id}
                            className="p-3 rounded bg-zinc-800/60 border border-zinc-700 flex flex-wrap md:flex-nowrap gap-3 items-center"
                        >
                            <span className="font-mono text-zinc-500 text-[11px] w-6">
                                #{index + 1}
                            </span>

                            {/* 옵션명 */}
                            <div className="w-full md:w-1/5">
                                <input
                                    type="text"
                                    placeholder="옵션명 (예: 색상)"
                                    value={opt.optionName}
                                    onChange={(e) =>
                                        handleOptionChange(opt.id, "optionName", e.target.value)
                                    }
                                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white focus:outline-none"
                                />
                            </div>

                            {/* 옵션값 */}
                            <div className="w-full md:w-1/5">
                                <input
                                    type="text"
                                    placeholder="옵션값 (예: Black-L)"
                                    value={opt.optionValue}
                                    onChange={(e) =>
                                        handleOptionChange(opt.id, "optionValue", e.target.value)
                                    }
                                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white focus:outline-none"
                                />
                            </div>

                            {/* 추가금 */}
                            <div className="w-full md:w-1/6">
                                <input
                                    type="number"
                                    placeholder="추가금 (원)"
                                    value={opt.surcharge || ""}
                                    onChange={(e) =>
                                        handleOptionChange(
                                            opt.id,
                                            "surcharge",
                                            Number(e.target.value)
                                        )
                                    }
                                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white font-mono focus:outline-none"
                                />
                            </div>

                            {/* Inventory SKU 선택 드롭다운 */}
                            <div className="w-full md:w-2/5">
                                <select
                                    value={opt.skuId}
                                    onChange={(e) =>
                                        handleOptionChange(opt.id, "skuId", e.target.value)
                                    }
                                    className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white focus:outline-none font-mono"
                                >
                                    <option value="">-- 매핑할 SKU 선택 --</option>
                                    {inventoryList.map((item) => (
                                        <option key={item.skuId} value={item.skuId}>
                                            {item.skuId} ({item.productName} | 재고: {item.currentStock}개)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 삭제 버튼 */}
                            <button
                                type="button"
                                onClick={() => handleRemoveOption(opt.id)}
                                className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 rounded"
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. 카테고리 설정 섹션 */}
            {categoryList.length > 0 && (
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-white border-b border-zinc-800 pb-2">
                        4. 카테고리 설정 (다중 선택 가능)
                    </h3>
                    <div className="flex flex-wrap gap-3 p-2 bg-zinc-800/40 rounded border border-zinc-800">
                        {categoryList.map((cat) => (
                            <label
                                key={cat.categoryId}
                                className="flex items-center gap-1.5 cursor-pointer bg-zinc-800 px-2.5 py-1 rounded border border-zinc-700 hover:border-zinc-600"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCategoryIds.includes(cat.categoryId)}
                                    onChange={(e) =>
                                        handleCategoryToggle(cat.categoryId, e.target.checked)
                                    }
                                    className="rounded bg-zinc-700 border-zinc-600"
                                />
                                <span className="text-zinc-200">{cat.categoryName}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. 제출 버튼 */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded text-sm disabled:opacity-50 transition-colors"
                >
                    {submitting ? "상품 등록 중..." : "신규 상품 등록 완료"}
                </button>
            </div>
        </form>
    );
}