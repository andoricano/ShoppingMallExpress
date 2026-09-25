"use client";

import { useEffect } from "react";
import { DashboardCard } from "@/component/main/DashboardCard";
import { useRouter } from "next/navigation";
import { useAdminOverview } from "@/hooks/useAdminOverview";

export default function MainPage() {
  const router = useRouter();
  const {
    overview,
    loading,
    error,
    forbidden,
    fetchOverview,
  } = useAdminOverview();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading && !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Dashboard 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">
            {error || "Dashboard 정보를 불러오지 못했습니다."}
          </p>
          {!forbidden && (
            <button
              type="button"
              onClick={fetchOverview}
              className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  const inventoryAlertSummary = overview.inventory.alerts
    .slice(0, 3)
    .map(
      (alert) =>
        `${alert.wareCode ?? alert.name} · ${alert.availableStock}개`,
    );

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
      {/* 타이틀 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
          관리자 메인 대시보드
        </h1>

        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => {
            router.push("/master");
          }}
        >
          세팅
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="스토어 디자인/레이아웃"
          mainText="메인 페이지"
          subText="저장 기능 미지원 (Mall v2 contract 미확정)"
          href="/design"
        />

        <DashboardCard
          title="주문 / 배송 관리"
          mainText={`출고 대기 ${overview.orders.pendingFulfillmentCount}건`}
          badgeCount={
            overview.orders.pendingFulfillmentCount
          }
          badgeColor="#228be6"
          href="/orders"
        />

        <DashboardCard
          title="환불 요청"
          mainText={`요청 ${overview.refunds.requestedCount}건`}
          badgeCount={
            overview.refunds.requestedCount
          }
          badgeColor="#ff4d4f"
          href="/refund"
        />

        <DashboardCard
          title="오늘 주문 금액"
          mainText={`${overview.todayOrders.totalAmount.toLocaleString()}원`}
          subText={`오늘 생성 주문 ${overview.todayOrders.count}건`}
          href="/orders"
        />

        <DashboardCard
          title="재고 관리"
          mainText={`저재고 ${overview.inventory.lowStockCount}개 / 품절 ${overview.inventory.outOfStockCount}개`}
          detailItems={inventoryAlertSummary}
          badgeCount={
            overview.inventory.lowStockCount +
            overview.inventory.outOfStockCount
          }
          badgeColor="#f59f00"
          href="/inventory"
        />

        <DashboardCard
          title="상품 게시물 관리"
          mainText={`게시 중 ${overview.productPosts.publishedCount}개`}
          subText={`전체 ${overview.productPosts.totalCount}개`}
          href="/products"
        />

        <DashboardCard
          title="회원 관리"
          mainText={`전체 ${overview.users.totalCount}명`}
          subText={`오늘 신규 가입 +${overview.users.todayNewCount}명`}
          href="/users"
        />


        <DashboardCard
          title="게시물 관리"
          mainText={`게시물 관리`}
          subText={`게시물을 관리하세요`}
          href="/posts"
        />
      </div>
    </div>
  );
}
