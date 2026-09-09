// packages/mall-page-viewer/src/types/mainPage.ts

/**
 * ==========================================
 * Page Section
 * ==========================================
 */

/**
 * Page Section 타입
 */
export type PageSectionType =
    | "PRODUCT"
    | "PROMOTION";

/**
 * Product Section Layout
 */
export type ProductSectionLayout =
    | "GRID"
    | "HORIZONTAL_SCROLL"
    | "LARGE";

/**
 * Product Card 타입
 */
export type ProductCardType =
    | "NO_DISCOUNT"
    | "DISCOUNT"
    | "DETAILED";

/**
 * 공통 Section 데이터
 */
export interface PageSectionBase {
    id: string;
    type: PageSectionType;
    order: number;
    isActive: boolean;
}


/**
 * ==========================================
 * Hero
 * ==========================================
 */

/**
 * Hero Section
 *
 * 메인 페이지 최상단에 표시되는 대표 영역
 */
export interface HeroSectionConfig {
    id: string;

    imageUrl?: string;

    title?: string;
    description?: string;

    relativePath?: string;

    order: number;
    isActive: boolean;
}


/**
 * ==========================================
 * Product
 * ==========================================
 */

/**
 * Product Card에 표시할 데이터
 */
export interface ProductCardData {
    id: string;

    imageUrl?: string;

    title: string;
    summary?: string;

    price: number;
    discount?: number;

    tags?: string[];
}

/**
 * Product Section
 */
export interface ProductSectionConfig
    extends PageSectionBase {
    type: "PRODUCT";

    title: string;

    products: ProductCardData[];

    layout: ProductSectionLayout;
    cardType: ProductCardType;
}


/**
 * ==========================================
 * Promotion
 * ==========================================
 */

/**
 * Promotion Card에 표시할 데이터
 */
export interface PromotionCardData {
    id: string;

    imageUrl: string;

    title?: string;
    description?: string;

    relativePath?: string;
}

/**
 * Promotion Section
 *
 * 여러 Promotion Card를 Queue / Carousel 형태로 표시
 */
export interface PromotionSectionConfig
    extends PageSectionBase {
    type: "PROMOTION";

    title?: string;

    promotions: PromotionCardData[];
}


/**
 * ==========================================
 * Page Section
 * ==========================================
 */

/**
 * Page Section
 */
export type PageSection =
    | ProductSectionConfig
    | PromotionSectionConfig;


/**
 * Header Menu Item
 *
 * Header에서 표시할 메뉴와 하위 메뉴를 정의합니다.
 */
export interface HeaderMenuItem {
    id: string;

    title: string;
    href: string;

    children?: HeaderMenuItem[];
}

/**
 * Header 설정
 */
export type HeaderMenuMode =
    | "NONE"
    | "DROPDOWN"
    | "MEGA";
export interface PageHeaderConfig {
    isActive: boolean;

    menuMode: HeaderMenuMode;

    menus: HeaderMenuItem[];
}

/**
 * ==========================================
 * Footer
 * ==========================================
 */

/**
 * Footer 설정
 */
export interface PageFooterConfig {
    isActive: boolean;

    businessName: string;
    representativeName: string;
    businessNumber: string;

    address: string;

    customerCenter?: string;
    additionalInfo?: string;
}


/**
 * ==========================================
 * Page Config
 * ==========================================
 */

/**
 * Client Page Config
 */
export interface PageConfig {
    id: string;

    header: PageHeaderConfig;

    hero: HeroSectionConfig[];

    sections: PageSection[];

    footer: PageFooterConfig;
}