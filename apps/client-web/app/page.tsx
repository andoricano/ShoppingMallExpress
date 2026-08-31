"use client";

import { useEffect } from "react";

import HeroBanner from "@/components/home/HomeBanner";
import ProductSection from "@/components/home/FeaturedSection";
import BrandStory from "@/components/home/BrandStory";

import { useProduct } from "@/hooks/useProduct";
import { configData } from "@/config/site";

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

  const activeHero = configData.hero
    .filter((hero) => hero.isActive)
    .sort((a, b) => a.order - b.order)[0];

  const activeSections = configData.sections
    .filter((section) => section.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      {activeHero && (
        <HeroBanner section={activeHero} />
      )}

      {/* Sections */}
      {activeSections.map((section) => {
        switch (section.type) {
          case "PRODUCT":
            return (
              <ProductSection
                key={section.id}
                title={section.title}
                productIds={section.productIds}
                layout={section.layout}
                products={productList}
                loading={loading}
                error={error}
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

      <BrandStory />
    </main>
  );
}