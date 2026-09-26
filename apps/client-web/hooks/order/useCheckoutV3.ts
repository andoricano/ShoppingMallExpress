"use client";

import { useMemo } from "react";

import { createCheckoutFlow, type CheckoutStore, type CheckoutTransport } from "@/lib/checkoutFlow";

const STORAGE_KEY = "mall.checkout.v3";

const sessionStore: CheckoutStore = {
    get: () => {
        try {
            return window.sessionStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    },
    set: (value) => {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, value);
        } catch {
            /* the held checkout is a convenience; a lost copy is handled as an orphan Payment */
        }
    },
    remove: () => {
        try {
            window.sessionStorage.removeItem(STORAGE_KEY);
        } catch {
            /* nothing to remove */
        }
    },
};

const transport: CheckoutTransport = async (path, body) => {
    const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    return { status: response.status, body: await response.json().catch(() => null) };
};

/** Browser binding of the Mall v3 checkout flow (state held in sessionStorage). */
export function useCheckoutV3() {
    return useMemo(() => createCheckoutFlow(transport, sessionStore), []);
}
