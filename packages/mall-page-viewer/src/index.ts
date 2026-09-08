// packages/mall-page-viewer/src/index.ts

export {
    mainPageMock,
} from "./mock";

export type {
    PageSectionType,
    ProductSectionLayout,
    ProductCardType,
    PageSectionBase,

    HeroSectionConfig,

    ProductCardData,
    ProductSectionConfig,

    PromotionCardData,
    PromotionSectionConfig,

    PageSection,

    PageHeaderConfig,
    PageFooterConfig,
    PageConfig,
} from "./types/mainPage";

// ==========================================
// Header
// ==========================================

export { default as Header } from "./components/header/Header";
export { default as UserAuthAction } from "./components/header/UserAuthAction";

// ==========================================
// Hero
// ==========================================

export { default as HeroBanner } from "./components/herobanner/HeroBanner";

// ==========================================
// Product
// ==========================================

export { ProductCard } from "./components/product/ProductCard";

export {
    ProductDetailedThumbnailCard,
} from "./components/product/ProductDetailedThumbnailCard";

export {
    default as ProductSection,
} from "./components/product/ProductSection";

// ==========================================
// Promotion
// ==========================================

export {
    default as PromotionCard,
} from "./components/promotion/PromotionCard";

export {
    default as PromotionSection,
} from "./components/promotion/PromotionSection";

// ==========================================
// Footer
// ==========================================

export {
    default as BusinessInfoFooter,
} from "./components/footer/BusinessInfoFooter";