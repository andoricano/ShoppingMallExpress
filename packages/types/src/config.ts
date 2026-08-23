import type { Product, ProductCategory } from "./product";          

/** 쇼핑몰 사업자 및 하단 푸터 정보 */
export interface BusinessInfo {
  companyName: string;      // 상호명
  representative: string;   // 대표자
  businessNumber: string;   // 사업자등록번호
  mailOrderNumber: string;  // 통신판매업신고번호
  address: string;          // 사업장 주소
  csEmail: string;          // CS 이메일
  csPhone: string;          // CS 전화번호
}

/** 메인 페이지 히어로 배너 */
export interface MainBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  linkUrl: string;
}

/** 전체 쇼핑몰 운영 Config (Admin & Client 공통) */
export interface MallConfig {
  categories: ProductCategory[];
  businessInfo: BusinessInfo;
  featuredProducts?: Product[];
  mainBanners?: MainBanner[];
}