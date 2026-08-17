"use client";

import { AuthDevSection } from "@/components/auth/AuthDevSection";
import { HistoryDevSection } from "@/components/history/HistoryDevSection";
import { InventoryDevSection } from "@/components/inventory/InventoryDevSection";
import { OrderDevSection } from "@/components/order/OrderDevSection";
import { PaymentDevSection } from "@/components/payment/PaymentDevSection";
import { ProductDevSection } from "@/components/product/ProductDevSection";
import { useState } from "react";

const PRD_DEV_ITEMS = [
  { id: "auth", label: "Auth", docName: "Auth.md", component: AuthDevSection },
  { id: "inventory", label: "Inventory", docName: "Inventory.md", component: InventoryDevSection },
  { id: "product", label: "Product", docName: "Product.md", component: ProductDevSection },
  { id: "order", label: "Order", docName: "Order.md", component: OrderDevSection },
  { id: "payment", label: "Payment", docName: "Payment.md", component: PaymentDevSection },
  { id: "history", label: "History", docName: "History.md", component: HistoryDevSection },
];

export default function DevScreen() {
  const [selectedId, setSelectedId] = useState<string>(PRD_DEV_ITEMS[0].id);

  const currentItem = PRD_DEV_ITEMS.find((item) => item.id === selectedId) ?? PRD_DEV_ITEMS[0];
  const ActiveComponent = currentItem.component;

  return (
    <div className="flex h-screen w-full bg-zinc-900 text-zinc-100 font-sans">
      {/* 사이드바 메뉴 */}
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">Dev Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">Mall v2.1 PRD 기반 테스트</p>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto">
          {PRD_DEV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`text-left px-4 py-3 rounded-lg text-sm transition-colors ${selectedId === item.id
                ? "bg-blue-600 text-white font-medium"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* 메인 영역 */}
      <main className="flex-1 p-10 overflow-y-auto">
        <section className="max-w-4xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{currentItem.label} 테스트</h2>
              <p className="text-xs text-zinc-400 mt-1">PRD 문서: {currentItem.docName}</p>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-950 min-h-[400px]">
            <ActiveComponent />
          </div>
        </section>
      </main>
    </div>
  );
}