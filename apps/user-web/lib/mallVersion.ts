/**
 * Mall v3 Admin surfaces switch (docs/mall1/v3/PHASES.md 2.2 / Phase 8).
 *
 * `NEXT_PUBLIC_MALL_V3=true` selects the v3 Admin actions: one-step order
 * transitions without PAID (PROCESSING needs full allocation), Admin cancel,
 * the ordered / allocated / shortage panel with explicit additional allocation,
 * and Refund decisions that create their reversal. It is browser-safe (a
 * boolean). Unset (default) the v2 behavior stays until the v3 cutover
 * (Phase 9).
 */
export const MALL_V3 = process.env.NEXT_PUBLIC_MALL_V3 === "true";
