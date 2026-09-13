"use client";

import type { History } from "@mall/types";

interface HistoryItemProps {
    history: History;

    onClick?: (
        history: History,
    ) => void;

    onViewPost?: (
        history: History,
    ) => void;
}

function formatDateTime(value: string) {
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

function formatPrice(
    value: unknown,
) {
    return typeof value === "number"
        ? `${value.toLocaleString("ko-KR")}원`
        : null;
}

function getActionLabel(
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

export default function HistoryItem({
    history,
    onClick,
    onViewPost,
}: HistoryItemProps) {
    const isOrder =
        history.targetType === "ORDER";

    const totalPrice =
        formatPrice(
            history.metadata
                ?.totalPrice,
        );

    const paymentId =
        typeof history.metadata
            ?.paymentId === "string"
            ? history.metadata
                .paymentId
            : null;

    return (
        <div className="flex w-full items-center gap-5 rounded-xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-slate-300 hover:bg-slate-50">
            {/* Main Area */}
            <button
                type="button"
                onClick={() =>
                    onClick?.(history)
                }
                className="min-w-0 flex-1 text-left"
            >
                {/* 1. Date */}
                <time
                    dateTime={
                        history.createdAt
                    }
                    className="block text-xs font-medium text-slate-400"
                >
                    {formatDateTime(
                        history.createdAt,
                    )}
                </time>

                {/* 2. Title */}
                <p className="mt-2 truncate text-base font-semibold text-slate-900">
                    {getActionLabel(
                        history.action,
                    )}
                </p>

                {/* 3. Information */}
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {isOrder && (
                        <>
                            <span>
                                주문번호{" "}
                                {history.targetId}
                            </span>

                            {totalPrice && (
                                <>
                                    <span className="text-slate-300">
                                        |
                                    </span>

                                    <span className="font-medium text-slate-700">
                                        {totalPrice}
                                    </span>
                                </>
                            )}

                            {paymentId && (
                                <>
                                    <span className="text-slate-300">
                                        |
                                    </span>

                                    <span className="truncate">
                                        결제번호{" "}
                                        {paymentId}
                                    </span>
                                </>
                            )}
                        </>
                    )}

                    {!isOrder && (
                        <span>
                            {history.targetType}{" "}
                            /{" "}
                            {history.targetId}
                        </span>
                    )}
                </div>
            </button>

            {/* Post */}
            {isOrder && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();

                        onViewPost?.(
                            history,
                        );
                    }}
                    className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900"
                >
                    게시물 보러가기
                </button>
            )}
        </div>
    );
}