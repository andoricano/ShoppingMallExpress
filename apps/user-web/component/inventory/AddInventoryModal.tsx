"use client";

import React, { useState, useEffect } from "react";
import { InventoryItem, SkuInventory, StockStatus } from "@mall/types";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryItem) => Promise<void>;
  categories?: string[];
}

interface SkuFormInput {
  customSkuId: string;
  optionName: string;
  currentStock: number;
  safetyStock: number;
  status: StockStatus | "AUTO";
}

const DEFAULT_CATEGORIES = ["SHOES", "CLOTHES", "ACC", "EQUIPMENT", "ELECTRONICS"];

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] || "SHOES");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [skus, setSkus] = useState<SkuFormInput[]>([
    { customSkuId: "", optionName: "250", currentStock: 10, safetyStock: 2, status: "AUTO" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setId("");
      setName("");
      setCategory(categories[0] || "SHOES");
      setCustomCategory("");
      setIsCustomCategory(false);
      setSkus([{ customSkuId: "", optionName: "", currentStock: 0, safetyStock: 0, status: "AUTO" }]);
    }
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleAddSkuRow = () => {
    setSkus((prev) => [
      ...prev,
      { customSkuId: "", optionName: "", currentStock: 0, safetyStock: 0, status: "AUTO" },
    ]);
  };

  const handleRemoveSkuRow = (index: number) => {
    if (skus.length === 1) {
      alert("최소 1개 이상의 옵션(SKU)이 필요합니다.");
      return;
    }
    setSkus((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkuChange = <K extends keyof SkuFormInput>(
    index: number,
    field: K,
    value: SkuFormInput[K]
  ) => {
    setSkus((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 실시간 총 재고 계산
  const calculatedTotalStock = skus.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) {
      alert("재고 그룹 식별자(ID)와 아이템명을 입력해주세요.");
      return;
    }

    // SKU 중복 검증
    const optionNames = skus.map((s) => s.optionName.trim());
    if (new Set(optionNames).size !== optionNames.length) {
      alert("중복된 옵션명이 존재합니다. 각 옵션명은 유일해야 합니다.");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;

    const formattedSkus: SkuInventory[] = skus.map((sku, index) => {
      const current = Number(sku.currentStock) || 0;
      const safety = Number(sku.safetyStock) || 0;

      // 자동 계산 상태 또는 수동 지정 상태 적용
      let calculatedStatus: StockStatus;
      if (sku.status === "AUTO") {
        if (current === 0) calculatedStatus = "SOLD_OUT";
        else if (current <= safety) calculatedStatus = "LOW_STOCK";
        else calculatedStatus = "IN_STOCK";
      } else {
        calculatedStatus = sku.status;
      }

      const skuId = sku.customSkuId.trim() || `${id.trim()}-${sku.optionName.trim() || index + 1}`;

      return {
        id: skuId,
        optionName: sku.optionName.trim(),
        currentStock: current,
        safetyStock: safety,
        status: calculatedStatus,
      };
    });

    const payload: InventoryItem = {
      id: id.trim(),
      name: name.trim(),
      category: finalCategory || undefined,
      totalStock: calculatedTotalStock,
      skus: formattedSkus,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "재고 등록 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">신규 재고 아이템 등록</h2>
            <p className="text-xs text-slate-500">재고 그룹 및 세부 SKU 옵션을 등록합니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 그룹 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  재고 그룹 식별자 (ID) *
                </label>
                <input
                  type="text"
                  placeholder="예: INV-SHOE-01"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">카테고리</label>
                {!isCustomCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(true)}
                      className="px-2.5 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      직접입력
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="카테고리명 직접 입력"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="px-2.5 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      선택
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">아이템명 *</label>
                <input
                  type="text"
                  placeholder="예: 나이키 에어 포스 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* SKU 옵션 정보 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SKU 목록</h3>
                <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
                  총 재고: {calculatedTotalStock}개
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddSkuRow}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                + 옵션 추가
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2.5">옵션명 *</th>
                    <th className="p-2.5">커스텀 SKU ID (선택)</th>
                    <th className="p-2.5 w-24">현재 재고</th>
                    <th className="p-2.5 w-24">안전 재고</th>
                    <th className="p-2.5 w-28">상태</th>
                    <th className="p-2.5 w-10 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skus.map((sku, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="예: 250, XL"
                          value={sku.optionName}
                          onChange={(e) => handleSkuChange(index, "optionName", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder={id ? `${id}-${sku.optionName || index + 1}` : "자동 생성"}
                          value={sku.customSkuId}
                          onChange={(e) => handleSkuChange(index, "customSkuId", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={sku.currentStock}
                          onChange={(e) => handleSkuChange(index, "currentStock", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={sku.safetyStock}
                          onChange={(e) => handleSkuChange(index, "safetyStock", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={sku.status}
                          onChange={(e) => handleSkuChange(index, "status", e.target.value as StockStatus | "AUTO")}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-500 text-[11px]"
                        >
                          <option value="AUTO">자동 계산</option>
                          <option value="IN_STOCK">IN_STOCK (정상)</option>
                          <option value="LOW_STOCK">LOW_STOCK (임박)</option>
                          <option value="SOLD_OUT">SOLD_OUT (품절)</option>
                          <option value="DISABLED">DISABLED (비활성)</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSkuRow(index)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-blue-300 transition-colors"
            >
              {isSubmitting ? "등록 중..." : "재고 등록 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};