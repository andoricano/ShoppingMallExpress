"use client";

import React from "react";
import type { AdminProductDetail, Ware } from "@mall/types";
import { ModalFrame } from "@/component/modal/ModalFrame";
import { useVariantWareLink } from "@/hooks/products/useVariantWareLink";

interface LinkVariantWareModalProps {
  /** The Ware that selected Variants are linked to. Mount only while open. */
  ware: Ware;
  onClose: () => void;
}

function optionText(detail: AdminProductDetail, optionValueIds: string[]) {
  return detail.options
    .flatMap((option) =>
      option.values
        .filter((value) => optionValueIds.includes(value.id))
        .map((value) => `${option.name}: ${value.value}`),
    )
    .join(" / ");
}

/**
 * Admin-only. Links existing ProductVariants (any Product, any number of
 * Variants) to one Ware through the Admin variant-wares Route Handler.
 */
export const LinkVariantWareModal: React.FC<LinkVariantWareModalProps> = ({
  ware,
  onClose,
}) => {
  const {
    products,
    detail,
    links,
    loading,
    error,
    searchProducts,
    selectProduct,
    clearProduct,
    linkVariantWare,
  } = useVariantWareLink();

  const [search, setSearch] = React.useState("");
  const [linkingId, setLinkingId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [rowError, setRowError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void searchProducts("");
  }, [searchProducts]);

  const handleLink = async (productVariantId: string) => {
    if (!detail || linkingId) {
      return;
    }

    setLinkingId(productVariantId);
    setNotice(null);
    setRowError(null);

    const outcome = await linkVariantWare(detail.id, {
      productVariantId,
      wareId: ware.id,
    });

    setLinkingId(null);

    if (outcome.ok) {
      setNotice(
        outcome.result.alreadyLinked
          ? "이미 연결되어 있습니다."
          : "Variant를 Ware에 연결했습니다.",
      );
    } else {
      setRowError(outcome.message);
    }
  };

  return (
    <ModalFrame
      isOpen
      onClose={onClose}
      title="Variant 연결"
      description={`Ware "${ware.name}"${ware.wareCode ? ` (${ware.wareCode})` : ""}에 연결할 Product Variant를 선택합니다.`}
      maxWidth="2xl"
      customFooter={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            닫기
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {!ware.isActive && (
          <p className="p-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
            비활성 Ware입니다. 연결할 수 있지만 활성화되기 전까지 주문 재고로 사용되지 않습니다.
          </p>
        )}

        {error && (
          <p className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </p>
        )}

        {!detail ? (
          <div className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void searchProducts(search);
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Product 이름 검색"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg disabled:opacity-50"
              >
                검색
              </button>
            </form>

            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">불러오는 중...</p>
            ) : products.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Product가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {products.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNotice(null);
                        setRowError(null);
                        void selectProduct(product.id);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-800">{product.name}</span>
                      {!product.isActive && (
                        <span className="ml-2 text-xs text-slate-400">비활성</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{detail.name}</h3>
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  setRowError(null);
                  clearProduct();
                }}
                className="text-xs text-slate-500 underline"
              >
                다른 Product 선택
              </button>
            </div>

            {notice && (
              <p className="p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                {notice}
              </p>
            )}

            {rowError && (
              <p className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {rowError}
              </p>
            )}

            <ul className="space-y-2">
              {detail.variants.map((variant) => {
                const linked =
                  links.find((entry) => entry.productVariantId === variant.id)?.wares ?? [];
                const linkedToThisWare = linked.some((entry) => entry.wareId === ware.id);
                const title =
                  [variant.label, optionText(detail, variant.optionValueIds)]
                    .filter(Boolean)
                    .join(" · ")
                  || variant.skuCode
                  || variant.id;

                return (
                  <li
                    key={variant.id}
                    className="p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {title}
                          {!variant.isActive && (
                            <span className="ml-2 text-xs text-slate-400">비활성</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {variant.skuCode ? `SKU ${variant.skuCode} · ` : ""}
                          {variant.price.toLocaleString()}원
                        </p>
                      </div>

                      {linkedToThisWare ? (
                        <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
                          이 Ware에 연결됨
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={linkingId !== null}
                          onClick={() => void handleLink(variant.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {linkingId === variant.id ? "연결 중..." : "이 Ware에 연결"}
                        </button>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      연결된 Ware:{" "}
                      {linked.length === 0
                        ? "없음 (구매자에게는 품절로 표시됩니다)"
                        : linked
                          .map((entry) => `${entry.warehouseName ?? "-"} / ${entry.wareName} (재고 ${entry.currentStock})`)
                          .join(", ")}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </ModalFrame>
  );
};
