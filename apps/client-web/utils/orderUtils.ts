import type { OrderStatus } from "@mall/types";

export function formatDateTime(value: string) {
    const date = new Date(value);

    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        },
    ).format(date);
}

export function formatPrice(
    value: unknown,
) {
    return typeof value === "number"
        ? `${value.toLocaleString("ko-KR")}원`
        : null;
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    PENDING: "주문 접수",
    PAID: "결제 완료",
    PROCESSING: "상품 준비 중",
    SHIPPED: "배송 중",
    DELIVERED: "배송 완료",
    CANCELLED: "주문 취소",
};

export function getOrderStatusLabel(
    status: OrderStatus,
): string {
    return ORDER_STATUS_LABEL[status] ?? status;
}

export function getMaxPointAmount(
    balance: number,
    purchasePrice: number,
): number {
    return Math.min(
        Math.max(0, balance),
        Math.max(0, purchasePrice),
    );
}

export function normalizePointAmount(
    amount: number,
    balance: number,
    purchasePrice: number,
): number {
    return Math.min(
        Math.max(0, amount),
        getMaxPointAmount(
            balance,
            purchasePrice,
        ),
    );
}