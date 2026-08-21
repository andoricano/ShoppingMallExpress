// components/order/OrderStatusBadge.tsx
"use client";

import React from "react";
// 모노레포 공통 타입 import
import type { OrderStatus } from "@mall/types";

interface OrderStatusBadgeProps {
    /** 주문 상태 */
    status: OrderStatus;
    /** 배지 크기 (기본값: md) */
    size?: "sm" | "md" | "lg";
    /** 추가 스타일 클래스 */
    className?: string;
}

/**
 * 주문 상태별 한글 라벨 및 Tailwind 스타일 매핑
 */
const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    PAYMENT_PENDING: {
        label: "결제 대기",
        className: "bg-amber-100 text-amber-800 border-amber-300",
    },
    ORDER_RECEIVED: {
        label: "주문 접수",
        className: "bg-blue-100 text-blue-800 border-blue-300",
    },
    CANCELLED: {
        label: "주문 취소",
        className: "bg-red-100 text-red-800 border-red-300",
    },
    COMPLETED: {
        label: "처리 완료",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
};

/**
 * 크기별 패딩 및 폰트 사이즈 매핑
 */
const SIZE_CONFIG: Record<"sm" | "md" | "lg", string> = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm font-semibold",
};

export function OrderStatusBadge({
    status,
    size = "md",
    className = "",
}: OrderStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || {
        label: status,
        className: "bg-gray-100 text-gray-800 border-gray-300",
    };

    const sizeClass = SIZE_CONFIG[size];

    return (
        <span
            className={`inline-flex items-center justify-center font-medium rounded-full border ${config.className} ${sizeClass} ${className}`}
        >
            {config.label}
        </span>
    );
}