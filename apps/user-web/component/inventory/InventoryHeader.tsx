"use client";

import React from "react";

interface InventoryHeaderProps {
    onOpenAddModal: () => void;
    onOpenAddWarehouseModal: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
    onOpenAddModal,
    onOpenAddWarehouseModal,
}) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    재고 관리
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Warehouse별 Ware 재고를 조회하고 수동 조정 및 등록을 관리합니다.
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onOpenAddWarehouseModal}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                    + Warehouse 등록
                </button>

                <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
                >
                    + 신규 Ware 등록
                </button>
            </div>
        </div>
    );
};
