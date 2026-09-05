// @/types/mainPage.ts

/**
 * 메인 페이지 Section 타입
 */
export type MainSectionType =
    | "PRODUCT"
    | "CATEGORY"
    | "BANNER";

/**
 * Product Section Layout
 */
export type ProductSectionLayout =
    | "GRID"
    | "HORIZONTAL_SCROLL"
    | "LARGE";

/**
 * Main Section 공통 데이터
 */
export interface MainSectionBase {
    id: string;
    type: MainSectionType;
    order: number;
    isActive: boolean;
}

/**
 * Hero Section
 */
export interface HeroSection {
    id: string;

    imageUrl?: string;
    title?: string;
    description?: string;

    relativePath?: string;

    order: number;
    isActive: boolean;
}

/**
 * Product Section
 *
 * 대표 상품 / 신상품 / 추천 상품 등을 공통으로 사용
 */
export interface ProductSection extends MainSectionBase {
    type: "PRODUCT";

    title: string;

    postIds: string[];

    layout: ProductSectionLayout;
}

/**
 * Category Section
 */
export interface CategorySection extends MainSectionBase {
    type: "CATEGORY";

    categoryIds: string[];
}

/**
 * Banner Section
 */
export interface BannerSection extends MainSectionBase {
    type: "BANNER";

    imageUrl: string;

    title?: string;
    description?: string;

    relativePath?: string;
}

/**
 * 메인 페이지 Section
 */
export type MainSection =
    | ProductSection
    | CategorySection
    | BannerSection;

/**
 * Header 설정
 */
export interface MainHeaderConfig {
    isActive: boolean;
    menuIds: string[];
}

/**
 * Footer 설정
 */
export interface MainFooterConfig {
    isActive: boolean;

    businessName: string;
    representativeName: string;
    businessNumber: string;

    address: string;

    customerCenter?: string;
    additionalInfo?: string;
}

/**
 * Client Main Page Config
 */
export interface ClientPageConfig {
    id: string;

    header: MainHeaderConfig;

    hero: HeroSection[];

    sections: MainSection[];

    footer: MainFooterConfig;
}