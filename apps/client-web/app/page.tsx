"use client";

import { useEffect, useMemo } from "react";
import type { ClientPageConfig, MainSection } from "@mall/types";

import HeroBanner from "@/components/home/HomeBanner";
import ProductSection from "@/components/home/ProductSection";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useProduct } from "@/hooks/useProduct";

export default function HomePage() {
  const {
    productList,
    loading,
    error,
    fetchProducts,
  } = useProduct();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 사이트 설정이 없을 때 사용하는 기본 설정
  const configData = useMemo<ClientPageConfig>(
    () => ({
      id: "default",

      header: {
        isActive: true,
        menuIds: [],
      },

      hero: [],

      sections: [
        {
          id: "default-products",
          type: "PRODUCT",
          order: 1,
          isActive: true,
          title: "상품",
          productIds: productList.map((product) => product.id),
          layout: "GRID",
        },
      ],

      footer: {
        isActive: true,
        businessName: "MALL",
        representativeName: "",
        businessNumber: "",
        address: "",
        customerCenter: "",
        additionalInfo: "",
      },
    }),
    [productList]
  );

  const activeHero = configData.hero
    .filter((hero) => hero.isActive)
    .sort((a, b) => a.order - b.order)[0];

  const activeSections = configData.sections
    .filter((section) => section.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <main className="min-h-screen">
      <Header config={configData.header} />

      {/* Hero */}
      {activeHero && <HeroBanner section={activeHero} />}

      {/* Sections */}
      {activeSections.map((section: MainSection) => {
        switch (section.type) {
          case "PRODUCT":
            return (
              <ProductSection
                key={section.id}
                section={section}
                products={productList}
              />
            );

          case "CATEGORY":
            return null;

          case "BANNER":
            return null;

          default:
            return null;
        }
      })}

      <Footer config={configData.footer} />

      {error && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </main>
  );
}