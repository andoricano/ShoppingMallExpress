/**
 * Mall v3 Consumer surfaces switch (docs/mall1/v3/PHASES.md 2.2 / Phase 8).
 *
 * `NEXT_PUBLIC_MALL_V3=true` selects the v3 checkout (payment first, Order
 * created at finalize), the v3 cancel/refund actions, and the v3 status
 * language. It is browser-safe (a boolean). Until the v3 cutover it is unset,
 * so production keeps running the v2 flow against the v2 database; the value
 * is set only together with the cutover (Phase 9).
 */
export const MALL_V3 = process.env.NEXT_PUBLIC_MALL_V3 === "true";
