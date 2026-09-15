// store/paymentStore.ts

"use client";

import { create } from "zustand";

import type {
    OrderShippingAddress,
} from "@mall/types";

interface PaymentItem {
    productId: string;
    quantity: number;
}

export interface PendingPayment {
    items: PaymentItem[];

    shippingAddress: OrderShippingAddress;

    productPrice: number;
    pointAmount: number;
    paymentPrice: number;
}

interface PaymentState {
    payment: PendingPayment | null;

    setPayment: (
        payment: PendingPayment,
    ) => void;

    clearPayment: () => void;
}

export const usePaymentStore =
    create<PaymentState>((set) => ({
        payment: null,

        setPayment: (payment) => {
            set({
                payment,
            });
        },

        clearPayment: () => {
            set({
                payment: null,
            });
        },
    }));