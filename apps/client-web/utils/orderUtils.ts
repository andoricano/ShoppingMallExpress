import { History, OrderStatus } from "@mall/types";

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

export function getActionLabel(
    action: History["action"],
) {
    switch (action) {
        case "ORDER_CREATED":
            return "주문이 접수되었습니다.";

        case "ORDER_SHIPPED":
            return "상품이 출고되었습니다.";

        case "ORDER_COMPLETED":
            return "배송이 완료되었습니다.";

        case "ORDER_CANCELLED":
            return "주문이 취소되었습니다.";

        case "STOCK_DEDUCTED":
            return "주문 상품의 재고가 차감되었습니다.";

        case "STOCK_RESTORED":
            return "주문 상품의 재고가 복구되었습니다.";

        case "USER_UPDATED":
            return "회원 정보가 수정되었습니다.";

        case "USER_ROLE_CHANGED":
            return "회원 권한이 변경되었습니다.";

        default:
            return action;
    }
}


export function getOrderStatusLabel(
    status: OrderStatus,
): string {
    switch (status) {
        case "PENDING":
            return "주문 접수";

        case "SHIPPING":
            return "배송 중";

        case "COMPLETED":
            return "배송 완료";

        case "CANCELLED":
            return "주문 취소";

        default:
            return status;
    }
}