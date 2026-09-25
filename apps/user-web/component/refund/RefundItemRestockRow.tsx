"use client";

import { useState } from "react";

import type {
    AdminRefundItem,
    AdminRestockRefundItemInput,
} from "@mall/types";

interface RefundItemRestockRowProps {
    refundId: string;
    item: AdminRefundItem;
    /** Only APPROVED refunds can be restocked. */
    approved: boolean;
    onRestock: (
        refundId: string,
        input: AdminRestockRefundItemInput,
    ) => Promise<{ ok: true } | { ok: false; message: string }>;
}

/**
 * Admin-only refund item row. Ware names are shown only here, and only for the
 * OrderItem's original allocation Wares (never in Consumer screens).
 */
export function RefundItemRestockRow({
    refundId,
    item,
    approved,
    onRestock,
}: RefundItemRestockRowProps) {
    const candidateWares = item.wares.filter(
        (ware) => ware.remainingQuantity > 0,
    );

    const [wareId, setWareId] = useState("");
    const [quantityText, setQuantityText] = useState("1");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const selectedWare =
        candidateWares.find((ware) => ware.wareId === wareId)
        ?? candidateWares[0];
    const maxQuantity = selectedWare
        ? Math.min(item.restockableQuantity, selectedWare.remainingQuantity)
        : 0;
    const quantity = Number(quantityText);
    const quantityValid =
        Number.isInteger(quantity)
        && quantity >= 1
        && quantity <= maxQuantity;

    const canRestock =
        approved
        && item.restockableQuantity > 0
        && selectedWare !== undefined;

    const handleRestock = async () => {
        if (!selectedWare || !quantityValid || submitting) {
            return;
        }

        if (!window.confirm(
            `반품을 확인했습니까?\n${item.productName}\n`
            + `${selectedWare.warehouseName ?? "-"} / ${selectedWare.wareName}에 `
            + `${quantity}개를 재고로 복구합니다.`,
        )) {
            return;
        }

        setSubmitting(true);
        setMessage(null);

        const result = await onRestock(refundId, {
            refundItemId: item.id,
            wareId: selectedWare.wareId,
            quantity,
        });

        setSubmitting(false);

        if (result.ok) {
            setQuantityText("1");
        } else {
            setMessage(result.message);
        }
    };

    return (
        <li className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-900">
                        {item.productName || item.orderItemId}
                    </p>
                    {item.variantLabel && (
                        <p className="text-xs text-slate-500">
                            {item.variantLabel}
                        </p>
                    )}
                </div>

                <dl className="flex gap-4 text-xs text-slate-600">
                    <div>
                        <dt className="text-slate-400">환불 수량</dt>
                        <dd className="font-semibold">{item.quantity}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-400">복구 완료</dt>
                        <dd className="font-semibold">{item.restockedQuantity}</dd>
                    </div>
                    <div>
                        <dt className="text-slate-400">복구 가능</dt>
                        <dd className="font-semibold">{item.restockableQuantity}</dd>
                    </div>
                </dl>
            </div>

            {item.restocks.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                    {item.restocks.map((restock) => {
                        const ware = item.wares.find(
                            (candidate) => candidate.wareId === restock.wareId,
                        );

                        return (
                            <li key={restock.id}>
                                {new Date(restock.createdAt).toLocaleString("ko-KR")}
                                {" · "}
                                {ware ? `${ware.warehouseName ?? "-"} / ${ware.wareName}` : restock.wareId}
                                {" +"}
                                {restock.quantity}
                            </li>
                        );
                    })}
                </ul>
            )}

            {canRestock && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                        value={selectedWare.wareId}
                        disabled={submitting}
                        onChange={(event) => {
                            setWareId(event.target.value);
                            setQuantityText("1");
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    >
                        {candidateWares.map((ware) => (
                            <option key={ware.wareId} value={ware.wareId}>
                                {ware.warehouseName ?? "-"} / {ware.wareName}
                                {" "}(복구 가능 {ware.remainingQuantity})
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        min={1}
                        max={maxQuantity}
                        step={1}
                        value={quantityText}
                        disabled={submitting}
                        onChange={(event) => setQuantityText(event.target.value)}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    />

                    <button
                        type="button"
                        disabled={submitting || !quantityValid}
                        onClick={() => void handleRestock()}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {submitting ? "복구 중..." : "재고 복구"}
                    </button>

                    {!quantityValid && (
                        <span className="text-xs text-rose-600">
                            1 ~ {maxQuantity} 사이의 수량을 입력하세요.
                        </span>
                    )}
                </div>
            )}

            {approved && item.restockableQuantity === 0 && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                    재고 복구 완료
                </p>
            )}

            {message && (
                <p className="mt-2 text-xs text-rose-600">{message}</p>
            )}
        </li>
    );
}
