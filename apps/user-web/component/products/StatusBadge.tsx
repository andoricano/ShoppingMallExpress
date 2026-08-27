"use client";

import { ProductStatus } from "@mall/types";
import React from "react";

interface StatusBadgeProps {
  status: ProductStatus;
}

const STATUS_MAP: Record<ProductStatus, { label: string; className: string }> = {
  DISPLAY: { label: "진열중", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  HIDDEN: { label: "숨김", className: "bg-slate-100 text-slate-600 border-slate-200" },
  SOLD_OUT: { label: "품절", className: "bg-amber-50 text-amber-700 border-amber-200" },
  DELETED: { label: "삭제됨", className: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const current = STATUS_MAP[status] || STATUS_MAP.HIDDEN;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.className}`}
    >
      {current.label}
    </span>
  );
};