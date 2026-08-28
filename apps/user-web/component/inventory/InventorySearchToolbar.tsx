"use client";

import React from "react";

interface InventorySearchToolbarProps {
    onRefresh: () => void;
}

export const InventorySearchToolbar: React.FC<InventorySearchToolbarProps> = ({
    onRefresh,
}) => {
    return (
        <div className="flex items-center justify-end">
            <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm"
            >
                새로고침
            </button>
        </div>
    );
};