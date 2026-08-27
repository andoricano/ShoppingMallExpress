"use client";

import React from "react";

interface BatchActionToolbarProps {
  selectedCount: number;
  onOpenStatusModal: () => void;
  onOpenCategoryModal: () => void;
  onBatchDelete: () => void;
}

export const BatchActionToolbar: React.FC<BatchActionToolbarProps> = ({
  selectedCount,
  onOpenStatusModal,
  onOpenCategoryModal,
  onBatchDelete,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in duration-200">
      <div className="text-xs font-semibold text-blue-900">
        선택된 항목 <span className="text-blue-600 font-bold">{selectedCount}</span>개
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenStatusModal}
          className="px-3 py-1.5 text-xs font-semibold bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
        >
          진열 상태 일괄 변경
        </button>
        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="px-3 py-1.5 text-xs font-semibold bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
        >
          카테고리 일괄 이동
        </button>
        <button
          type="button"
          onClick={onBatchDelete}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-colors"
        >
          선택 삭제
        </button>
      </div>
    </div>
  );
};