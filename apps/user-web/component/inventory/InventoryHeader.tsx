"use client";

import React from "react";

interface InventoryHeaderProps {
    onOpenAddModal: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
    onOpenAddModal,
}) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    재고 관리
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    SKU별 재고 수량을 조회하고 수동 조정 및 재고 등록을 관리합니다.
                </p>
            </div>

            <button
                type="button"
                onClick={onOpenAddModal}
                className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
                + 신규 재고 등록
            </button>
        </div>
    );
};