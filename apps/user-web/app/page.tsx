'use client';

import React from 'react';
import { DashboardCard } from '@/component/main/DashboardCard';
import { AdminOverviewData } from '@/types/admin';

// 테스트용 임시 데이터
const MOCK_OVERVIEW_DATA: AdminOverviewData = {
  design: {
    activeThemeName: 'SUMMER_PROMO_V1',
    lastEditedAt: '2026.08.24',
  },
  order: {
    pendingDeliveryCount: 12,
  },
  claim: {
    pendingCancelCount: 2,
    pendingReturnCount: 1,
  },
  sales: {
    todayTotalAmount: 1250000,
    todayOrderCount: 18,
  },
  inventory: {
    lowStockCount: 4,
    outOfStockCount: 1,
    alertThumbnails: [
      'https://via.placeholder.com/150',
      'https://via.placeholder.com/150',
    ],
  },
  product: {
    activeProductCount: 48,
    representativeThumbnail: 'https://via.placeholder.com/150',
  },
  user: {
    totalUserCount: 1240,
    todayNewUserCount: 8,
  },
};

export default function MainPage() {
  const data = MOCK_OVERVIEW_DATA;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* 타이틀 */}
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">
        관리자 메인 대시보드
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <DashboardCard
          title="스토어 디자인/레이아웃"
          mainText={data.design.activeThemeName}
          subText={`최종 수정: ${data.design.lastEditedAt}`}
          href="/design"
        />
        <DashboardCard
          title="주문 / 배송 관리"
          mainText={`미배송 ${data.order.pendingDeliveryCount}건`}
          badgeCount={data.order.pendingDeliveryCount}
          badgeColor="#228be6"
          href="/orders"
        />
        <DashboardCard
          title="취소 / 반품 승인"
          mainText={`요청 ${data.claim.pendingCancelCount + data.claim.pendingReturnCount}건`}
          badgeCount={data.claim.pendingCancelCount + data.claim.pendingReturnCount}
          badgeColor="#ff4d4f"
          href="/claims"
        />
        <DashboardCard
          title="오늘의 매출"
          mainText={`${data.sales.todayTotalAmount.toLocaleString()}원`}
          subText={`총 ${data.sales.todayOrderCount}건 결제`}
          href="/analytics"
        />
        <DashboardCard
          title="재고 관리"
          mainText={`품절 임박 ${data.inventory.lowStockCount}개 / 품절 ${data.inventory.outOfStockCount}개`}
          thumbnails={data.inventory.alertThumbnails}
          badgeCount={data.inventory.lowStockCount}
          badgeColor="#f59f00"
          href="/inventory"
        />
        <DashboardCard
          title="상품 관리"
          mainText={`전시 중 ${data.product.activeProductCount}개`}
          thumbnails={data.product.representativeThumbnail ? [data.product.representativeThumbnail] : []}
          href="/products"
        />
        <DashboardCard
          title="회원 관리"
          mainText={`전체 ${data.user.totalUserCount}명`}
          subText={`오늘 신규 가입 +${data.user.todayNewUserCount}명`}
          href="/users"
        />

        <DashboardCard
          title="포스트 상세 쓰기"
          mainText={`test`}
          subText={`test`}
          href="/products/post/"
        />
      </div>
    </div>
  );
}