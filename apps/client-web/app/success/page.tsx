"use client";

import { useMemo } from "react";
import Link from "next/link";

export default function OrderSuccessPage() {
  // 주문 번호 임시 생성 (예: ORD-YYYYMMDD-XXXX)
  const orderId = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${today}-${random}`;
  }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-2">주문이 완료되었습니다!</h1>
      <p className="text-neutral-500 mb-8">
        고객님의 주문이 성공적으로 접수되었습니다.
      </p>

      <div className="bg-neutral-50 p-6 rounded-lg text-left mb-8 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">주문 번호</span>
          <span className="font-mono font-bold text-neutral-900">{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">주문 상태</span>
          <span className="font-medium text-emerald-600">결제 완료 (배송 준비 중)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/"
          className="w-full border border-neutral-300 py-3.5 text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          메인으로 돌아가기
        </Link>
        <Link
          href="/products"
          className="w-full bg-black text-white py-3.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </main>
  );
}