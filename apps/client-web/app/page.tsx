"use client";

import { useEffect, useMemo } from "react";
import type { ClientPageConfig, MainSection } from "@mall/types";

import HeroBanner from "@/components/home/HomeBanner";
import ProductSection from "@/components/home/ProductSection";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { useProductPost } from "@/hooks/useProductPost";

export default function HomePage() {
  const {
    postList,
    loading,
    error,
    fetchPosts,
  } = useProductPost();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);



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
          postIds: postList.map(
            (post) => post.id,
          ),
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
    [postList],
  );

  const activeHero = configData.hero
    .filter((hero) => hero.isActive)
    .sort(
      (a, b) => a.order - b.order,
    )[0];

  const activeSections = configData.sections
    .filter((section) => section.isActive)
    .sort(
      (a, b) => a.order - b.order,
    );

  return (
    <main className="min-h-screen">
      <Header config={configData.header} />

      {activeHero && (
        <HeroBanner section={activeHero} />
      )}

      {activeSections.map(
        (section: MainSection) => {
          switch (section.type) {
            case "PRODUCT":
              return (
                <ProductSection
                  key={section.id}
                  section={section}
                  posts={postList}
                />
              );

            case "CATEGORY":
              return null;

            case "BANNER":
              return null;

            default:
              return null;
          }
        },
      )}

      <Footer config={configData.footer} />

      {error && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
          {error}
        </div>
      )}
    </main>
  );
}