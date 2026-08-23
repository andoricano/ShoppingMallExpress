import FeaturedSection from "@/components/home/FeaturedSection";
import BrandStory from "@/components/home/BrandStory";
import HeroBanner from "@/components/home/HomeBanner";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroBanner />
      <FeaturedSection />
      <BrandStory />
    </main>
  );
}