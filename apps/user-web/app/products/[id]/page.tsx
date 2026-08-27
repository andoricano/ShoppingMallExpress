"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAdminProductDetail } from "@/hooks/products/useAdminProductDetail";
import {
  DiscountType,
  ProductOption,
  ProductStatus,
  UpdateProductPayload,
} from "@mall/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  // 훅에서 제공하는 정확한 이름(fetchProductById)으로 구조분해할당
  const { product, fetchProductById, updateProduct, deleteProduct, loading } =
    useAdminProductDetail();

  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<Extract<ProductStatus, "DISPLAY" | "HIDDEN">>("DISPLAY");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [discountType, setDiscountType] = useState<DiscountType | "NONE">("NONE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountStartDate, setDiscountStartDate] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [subImageUrlsText, setSubImageUrlsText] = useState("");
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (productId) {
      fetchProductById(productId); // 이름 수정 완료
    }
  }, [productId, fetchProductById]);

  useEffect(() => {
    if (product) {
      setProductName(product.productName || "");
      setCategoryId(product.categoryIds?.[0] || "");
      setStatus(product.status === "HIDDEN" ? "HIDDEN" : "DISPLAY");
      setSortOrder(product.sortOrder || 0);
      setBasePrice(product.basePrice || 0);
      setDiscountType(product.discountType || "NONE");
      setDiscountValue(product.discountValue || 0);
      setDiscountStartDate(product.discountStartDate || "");
      setDiscountEndDate(product.discountEndDate || "");
      setMainImageUrl(product.mainImageUrl || "");
      setSubImageUrlsText(product.subImageUrls?.join("\n") || "");
      setOptions(product.options || []);
      setDescription(product.description || "");
    }
  }, [product]);

  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      { optionName: "", optionValue: "", surcharge: 0, skuId: "" },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (
    index: number,
    field: keyof ProductOption,
    value: string | number
  ) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    const subImageUrls = subImageUrlsText
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    const payload: UpdateProductPayload = {
      productName,
      mainImageUrl,
      subImageUrls,
      description,
      status,
      sortOrder: Number(sortOrder),
      basePrice: Number(basePrice),
      discountType: discountType === "NONE" ? undefined : discountType,
      discountValue: discountType === "NONE" ? undefined : Number(discountValue),
      discountStartDate: discountStartDate || undefined,
      discountEndDate: discountEndDate || undefined,
      options,
      categoryIds: categoryId ? [categoryId] : [],
    };

    try {
      await updateProduct(productId, payload);
      alert("상품 정보가 수정되었습니다.");
      router.push("/products");
    } catch (err) {
      alert(err instanceof Error ? err.message : "상품 수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return;

    try {
      await deleteProduct(productId);
      alert("상품이 삭제되었습니다.");
      router.push("/products");
    } catch (err) {
      alert(err instanceof Error ? err.message : "상품 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between py-4 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 px-2">
            <h1 className="text-xl font-bold text-slate-900">상품 정보 수정</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:bg-slate-300"
              >
                {loading ? "저장 중..." : "수정 완료"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* 1. Basic Info Section */}
            <section className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800">기본 정보</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="상품명을 입력하세요"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    카테고리 ID
                  </label>
                  <input
                    type="text"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    placeholder="카테고리 ID 입력"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    진열 상태 *
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as Extract<ProductStatus, "DISPLAY" | "HIDDEN">)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 bg-white"
                  >
                    <option value="DISPLAY">진열중 (DISPLAY)</option>
                    <option value="HIDDEN">숨김 (HIDDEN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                </div>
              </div>
            </section>

            {/* 2. Price & Discount Section */}
            <section className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800">가격 및 할인 정보</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    정상가 (원) *
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    할인 유형
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType | "NONE")}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 bg-white"
                  >
                    <option value="NONE">할인 없음</option>
                    <option value="FIXED_AMOUNT">정액 할인 (원)</option>
                    <option value="PERCENTAGE">정률 할인 (%)</option>
                  </select>
                </div>

                {discountType !== "NONE" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      할인값 ({discountType === "PERCENTAGE" ? "%" : "원"})
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                  </div>
                )}
              </div>

              {discountType !== "NONE" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      할인 시작일
                    </label>
                    <input
                      type="datetime-local"
                      value={discountStartDate}
                      onChange={(e) => setDiscountStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      할인 종료일
                    </label>
                    <input
                      type="datetime-local"
                      value={discountEndDate}
                      onChange={(e) => setDiscountEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* 3. Media Section */}
            <section className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800">이미지 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    대표 이미지 URL *
                  </label>
                  <input
                    type="url"
                    value={mainImageUrl}
                    onChange={(e) => setMainImageUrl(e.target.value)}
                    placeholder="https://example.com/main.jpg"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    서브 이미지 URL (줄바꿈으로 구분)
                  </label>
                  <textarea
                    rows={3}
                    value={subImageUrlsText}
                    onChange={(e) => setSubImageUrlsText(e.target.value)}
                    placeholder={"https://example.com/sub1.jpg\nhttps://example.com/sub2.jpg"}
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 resize-y"
                  />
                </div>
              </div>
            </section>

            {/* 4. Options Section */}
            <section className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">상품 옵션</h2>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  + 옵션 추가
                </button>
              </div>

              {options.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">등록된 옵션이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 border border-slate-100 rounded-lg bg-slate-50/50"
                    >
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="옵션명 (예: 색상)"
                          value={opt.optionName}
                          onChange={(e) =>
                            handleOptionChange(idx, "optionName", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="옵션값 (예: Red)"
                          value={opt.optionValue}
                          onChange={(e) =>
                            handleOptionChange(idx, "optionValue", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          placeholder="추가금액"
                          value={opt.surcharge}
                          onChange={(e) =>
                            handleOptionChange(idx, "surcharge", Number(e.target.value))
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="SKU ID"
                          value={opt.skuId}
                          onChange={(e) =>
                            handleOptionChange(idx, "skuId", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div className="md:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. Detail Content Section */}
            <section className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800">상세 설명</h2>
              <div>
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="상품 상세 설명을 입력하세요"
                  className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/25 resize-y"
                />
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}