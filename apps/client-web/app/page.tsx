import type { MainSection } from "@mall/types";
import HeroBanner from "@/components/home/HomeBanner";
import FeaturedSection from "@/components/home/FeaturedSection";
import { configData } from "@/config/site";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { products } from "@/config/products";


export default function HomePage() {
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

              <FeaturedSection
                key={section.id}
                section={section}
                products={products}
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
    </main>
  );
}