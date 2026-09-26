"use client";

import { useReducer, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { PaymentTestResult } from "@mall/types";

import { PaymentTestResultPicker } from "@/components/payment/PaymentTestResultPicker";
import { useCheckoutV3 } from "@/hooks/order/useCheckoutV3";
import { createClient } from "@/lib/supabase/client";
import type { CheckoutState } from "@/lib/checkoutFlow";

type Notice = { tone: "error" | "info"; text: string } | null;

/** Removes the purchased lines from the server Cart after the Order exists (DN-23). Best effort. */
async function clearPurchasedCartLines(state: CheckoutState) {
    try {
        const supabase = createClient();
        const { data } = await supabase.rpc("get_cart");
        const bought = new Set(state.items.map((item) => item.productVariantId));
        const lines = ((data as { items?: { id: string; productVariantId: string }[] } | null)?.items ?? [])
            .filter((line) => bought.has(line.productVariantId));

        for (const line of lines) {
            await supabase.rpc("remove_cart_item", { p_cart_item_id: line.id });
        }
    } catch {
        /* the Order exists; a leftover Cart line is only a convenience issue */
    }
}

/**
 * Mall v3 payment step (Stage 1 -> Stage 2). The checkout data is held by this
 * browser session; the server has only the Payment. Pressing the button pays
 * (PG test mode) and, once the Payment succeeded, finalizes: the Order is
 * created only then. Repeating any step is safe. The Client sees coarse
 * outcomes only (BR-20, DN-19).
 */
export function CheckoutPayment() {
    const router = useRouter();
    const flow = useCheckoutV3();

    // The held checkout lives in sessionStorage: read it on the client only
    // (no server snapshot), and re-read after a step changed it.
    const loaded = useSyncExternalStore(() => () => undefined, () => true, () => false);
    const [version, bump] = useReducer((n: number) => n + 1, 0);
    const [discarded, setDiscarded] = useState(false);
    const state: CheckoutState | null = loaded && !discarded && version >= 0 ? flow.state() : null;
    const [testResult, setTestResult] = useState<PaymentTestResult>("SUCCESS");
    const [processing, setProcessing] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);
    const [needsRestart, setNeedsRestart] = useState(false);

    if (!loaded) {
        return <p className="text-sm text-slate-500">주문 정보를 불러오는 중...</p>;
    }

    if (!state?.paymentId) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-600">결제할 주문 정보가 없습니다.</p>
                <Link href="/cart" className="text-sm underline">
                    장바구니로 이동
                </Link>
            </div>
        );
    }

    const finalizeOrder = async () => {
        const result = await flow.finalize();

        if (result.kind === "ORDER") {
            await clearPurchasedCartLines(state);
            flow.clear();
            router.replace(`/success?orderId=${encodeURIComponent(result.orderId)}`);
            return;
        }

        if (result.kind === "REJECTED") {
            setDiscarded(true);
            setNotice({
                tone: "error",
                text: "주문을 완료하지 못해 결제가 취소 처리됩니다. 상품 상태를 확인한 뒤 다시 주문해 주세요.",
            });
            return;
        }

        setNotice({
            tone: "error",
            text: "주문을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요. 결제는 유지되며 다시 시도하면 같은 주문으로 이어집니다.",
        });
    };

    const handlePay = async () => {
        setProcessing(true);
        setNotice(null);

        try {
            if (needsRestart) {
                const restarted = await flow.restart();

                if (restarted.kind !== "STARTED") {
                    setNotice({
                        tone: "error",
                        text: restarted.kind === "NOT_SELLABLE"
                            ? "현재 구매할 수 없는 상품이 포함되어 있습니다. 장바구니에서 확인해 주세요."
                            : "결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
                    });
                    return;
                }

                setNeedsRestart(false);
                bump();
            }

            const paid = await flow.pay(testResult);

            if (paid.kind === "PG_FAILED") {
                setNeedsRestart(true);
                setNotice({ tone: "error", text: "결제에 실패했습니다. 다시 시도하면 새 결제로 진행됩니다." });
                return;
            }

            if (paid.kind === "ERROR") {
                setNotice({ tone: "error", text: "결제 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." });
                return;
            }

            await finalizeOrder();
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
                <ul className="divide-y divide-slate-100">
                    {state.lines.map((line, index) => (
                        <li key={index} className="flex justify-between py-2 text-sm">
                            <span className="min-w-0 truncate">
                                {line.name}
                                {line.label && ` / ${line.label}`} × {line.quantity}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-500">결제 금액</span>
                    <span className="text-2xl font-bold text-slate-900">
                        {(state.amount ?? 0).toLocaleString("ko-KR")}원
                    </span>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
                <PaymentTestResultPicker
                    value={testResult}
                    onChange={setTestResult}
                    disabled={processing}
                />

                {notice && (
                    <p
                        className={`mt-4 rounded-lg px-3 py-2 text-sm ${notice.tone === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"}`}
                    >
                        {notice.text}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handlePay}
                    disabled={processing}
                    className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {processing
                        ? "처리 중..."
                        : `${(state.amount ?? 0).toLocaleString("ko-KR")}원 결제하기`}
                </button>
            </section>
        </div>
    );
}
