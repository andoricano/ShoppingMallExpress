export interface AdminOverviewData {
  // 2.0 클라이언트 디자인/레이아웃
  design: {
    activeThemeName: string;      // 예: "SUMMER_PROMO_V1"
    lastEditedAt: string;         // ISO Date String
  };

  // 2.1 주문/배송
  order: {
    pendingDeliveryCount: number; // 미배송/배송준비 건수
  };

  // 2.2 취소/환불 (클레임)
  claim: {
    pendingCancelCount: number;   // 취소 요청 건수
    pendingReturnCount: number;   // 반품/교환 요청 건수
  };

  // 2.3 매출 통계
  sales: {
    todayTotalAmount: number;     // 금일 누적 매출액
    todayOrderCount: number;      // 금일 결제 건수
  };

  // 2.4 재고
  inventory: {
    lowStockCount: number;        // 품절 임박 상품 수
    outOfStockCount: number;      // 품절 상품 수
    alertThumbnails: string[];    // 품절 임박/품절 대표 상품 썸네일 URL 리스트
  };

  // 2.5 상품
  product: {
    activeProductCount: number;   // 현재 판매/전시 중인 총 상품 수
    representativeThumbnail?: string; // 대표 상품 썸네일 URL
  };

  // 2.6 회원
  user: {
    totalUserCount: number;       // 전체 회원 수
    todayNewUserCount: number;    // 오늘 신규 가입자 수
  };
}