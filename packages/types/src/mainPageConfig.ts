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
 *
 * 메인 페이지 최상단 전용 영역
 * MainSection과 별도로 관리
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
 */
export interface ProductSection
    extends MainSectionBase {
    type: "PRODUCT";

    title: string;

    /**
     * Product Post ID
     */
    postIds: string[];

    layout: ProductSectionLayout;
}

/**
 * Category Section
 */
export interface CategorySection
    extends MainSectionBase {
    type: "CATEGORY";

    categoryIds: string[];
}

/**
 * Banner Section
 */
export interface BannerSection
    extends MainSectionBase {
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

    /**
     * 메인 최상단 Hero
     */
    hero: HeroSection[];

    /**
     * Hero 아래의 동적 Section
     */
    sections: MainSection[];

    footer: MainFooterConfig;
}