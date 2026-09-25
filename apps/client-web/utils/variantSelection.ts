import type {
    ConsumerProductVariant,
    ProductDetail,
} from "@mall/types";

/** Selected ProductOptionValue id per ProductOption id. */
export type OptionSelection = Record<string, string>;

export type OptionValueState =
    /** At least one purchasable Variant contains this value. */
    | "AVAILABLE"
    /** Variants exist but none is currently purchasable. */
    | "SOLD_OUT"
    /** No Variant combines this value with the other selected values. */
    | "UNAVAILABLE";

function selectedValueIds(selection: OptionSelection) {
    return Object.values(selection).filter(Boolean);
}

/**
 * Resolves the Variant for the current selection. A Product without options
 * resolves to its only Variant; otherwise every required Option must
 * be selected and the Variant's option-value set must equal the selection.
 */
export function resolveVariant(
    product: ProductDetail,
    selection: OptionSelection,
): ConsumerProductVariant | null {
    if (product.options.length === 0) {
        return product.variants.length === 1
            ? product.variants[0]!
            : null;
    }

    const missingRequired = product.options.some(
        (option) => option.isRequired && !selection[option.id],
    );

    if (missingRequired) {
        return null;
    }

    const selected = selectedValueIds(selection);

    return product.variants.find(
        (variant) =>
            variant.optionValueIds.length === selected.length
            && selected.every((id) => variant.optionValueIds.includes(id)),
    ) ?? null;
}

/** State of an OptionValue given the values selected for the other Options. */
export function getOptionValueState(
    product: ProductDetail,
    selection: OptionSelection,
    optionId: string,
    valueId: string,
): OptionValueState {
    const others = Object.entries(selection)
        .filter(([id, value]) => id !== optionId && value)
        .map(([, value]) => value);

    const candidates = product.variants.filter(
        (variant) =>
            variant.optionValueIds.includes(valueId)
            && others.every((id) => variant.optionValueIds.includes(id)),
    );

    if (candidates.length === 0) {
        return "UNAVAILABLE";
    }

    return candidates.some((variant) => variant.isAvailable)
        ? "AVAILABLE"
        : "SOLD_OUT";
}

/** Lowest Variant price, used as "from" price before a Variant is chosen. */
export function getMinimumPrice(product: ProductDetail): number | null {
    return product.variants.length > 0
        ? Math.min(...product.variants.map((variant) => variant.price))
        : null;
}
