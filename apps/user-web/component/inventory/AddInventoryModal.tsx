"use client";

import React, { useState } from "react";
import { InventoryItem, SkuInventory } from "@mall/types";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventoryItem) => Promise<void>;
}

// 등록 시점에 사용자에게 입력받는 SKU 양식 (id, status는 자동 계산/생성)
interface SkuFormInput {
  optionName: string;
  currentStock: number;
  safetyStock: number;
}

export const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("SHOES");
  const [skus, setSkus] = useState<SkuFormInput[]>([
    { optionName: "250", currentStock: 10, safetyStock: 2 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddSkuRow = () => {
    setSkus((prev) => [...prev, { optionName: "", currentStock: 0, safetyStock: 0 }]);
  };

  const handleRemoveSkuRow = (index: number) => {
    if (skus.length === 1) {
      alert("최소 1개 이상의 옵션(SKU)이 필요합니다.");
      return;
    }
    setSkus((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkuChange = (index: number, field: keyof SkuFormInput, value: string | number) => {
    setSkus((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      alert("재고 그룹 식별자(ID)와 아이템명을 입력해주세요.");
      return;
    }

    // 입력 데이터를 정확한 InventoryItem 규격으로 변환
    const formattedSkus: SkuInventory[] = skus.map((sku, index) => {
      const current = Number(sku.currentStock);
      const safety = Number(sku.safetyStock);

      return {
        id: `${id}-${sku.optionName || index + 1}`,
        optionName: sku.optionName,
        currentStock: current,
        safetyStock: safety,
        status: current === 0 ? "SOLD_OUT" : current <= safety ? "LOW_STOCK" : "IN_STOCK",
      };
    });

    const totalStock = formattedSkus.reduce((sum, item) => sum + item.currentStock, 0);

    const payload: InventoryItem = {
      id,
      name,
      category,
      totalStock,
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
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">신규 재고 아이템 등록</h2>
            <p className="text-xs text-slate-500">InventoryItem 규격에 맞게 재고 그룹과 SKU 정보를 등록합니다.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">재고 그룹 식별자 (id) *</label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">카테고리 (category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="SHOES">SHOES</option>
                  <option value="CLOTHES">CLOTHES</option>
                  <option value="ACC">ACC</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">아이템명 (name) *</label>
                <input
                  type="text"
                  placeholder="예: 나이키 운동화"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">SKU 목록 (skus)</h3>
              <button
                type="button"
                onClick={handleAddSkuRow}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                + 옵션 추가
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">옵션명 (optionName) *</th>
                    <th className="p-3 w-28">현재 재고 (currentStock)</th>
                    <th className="p-3 w-28">안전 재고 (safetyStock)</th>
                    <th className="p-3 w-12 text-center">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {skus.map((sku, index) => (
                    <tr key={index}>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="예: 250, XL"
                          value={sku.optionName}
                          onChange={(e) => handleSkuChange(index, "optionName", e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={sku.currentStock}
                          onChange={(e) => handleSkuChange(index, "currentStock", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={sku.safetyStock}
                          onChange={(e) => handleSkuChange(index, "safetyStock", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-right"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSkuRow(index)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg">
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-blue-300"
            >
              {isSubmitting ? "등록 중..." : "재고 등록 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};