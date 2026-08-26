import { useState, useEffect, useMemo } from "react";
import { InventoryItem, SkuInventory, StockStatus } from "@mall/types";

export interface SkuFormInput {
  customSkuId: string;
  optionName: string;
  currentStock: number;
  safetyStock: number;
  status: StockStatus | "AUTO";
}

interface UseAddInventoryFormProps {
  isOpen: boolean;
  categories: string[];
  onSubmit: (data: InventoryItem) => Promise<void>;
  onClose: () => void;
}

export const useAddInventoryForm = ({
  isOpen,
  categories,
  onSubmit,
  onClose,
}: UseAddInventoryFormProps) => {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] || "SHOES");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [skus, setSkus] = useState<SkuFormInput[]>([
    { customSkuId: "", optionName: "250", currentStock: 10, safetyStock: 2, status: "AUTO" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달 열릴 때 폼 초기화
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
  const calculatedTotalStock = useMemo(
    () => skus.reduce((sum, item) => sum + (Number(item.currentStock) || 0), 0),
    [skus]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!id.trim() || !name.trim()) {
      alert("재고 그룹 식별자(ID)와 아이템명을 입력해주세요.");
      return;
    }

    const optionNames = skus.map((s) => s.optionName.trim());
    if (new Set(optionNames).size !== optionNames.length) {
      alert("중복된 옵션명이 존재합니다. 각 옵션명은 유일해야 합니다.");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;

    const formattedSkus: SkuInventory[] = skus.map((sku, index) => {
      const current = Number(sku.currentStock) || 0;
      const safety = Number(sku.safetyStock) || 0;

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

  return {
    state: {
      id,
      name,
      category,
      customCategory,
      isCustomCategory,
      skus,
      isSubmitting,
      calculatedTotalStock,
    },
    actions: {
      setId,
      setName,
      setCategory,
      setCustomCategory,
      setIsCustomCategory,
      handleAddSkuRow,
      handleRemoveSkuRow,
      handleSkuChange,
      handleSubmit,
    },
  };
};