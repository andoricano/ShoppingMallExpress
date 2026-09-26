/**
 * Mall v3 switch (docs/mall1/v3/PHASES.md 2.2 / Phase 8, BR-49, DN-48).
 *
 * `NEXT_PUBLIC_MALL_V3=true`: ordering is handed off to the client-web checkout
 * (a real Order exists only after the PG payment, and this PWA has no PG UI);
 * the PWA keeps product list/detail, Cart, and Order lookup. Unset (default),
 * the v2 behavior stays until the v3 cutover (Phase 9). Both values are
 * browser-safe.
 */
export const MALL_V3 = process.env.NEXT_PUBLIC_MALL_V3 === "true";

/** Base URL of the client-web checkout used for the hand-off (browser-safe). */
export const CLIENT_WEB_URL = (process.env.NEXT_PUBLIC_CLIENT_WEB_URL ?? "").replace(/\/+$/, "");
