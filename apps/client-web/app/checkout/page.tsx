"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/useOrderStore";

export default function OrderCheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useOrderStore();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    memo: "",
  });

  const subtotal = cartItems.reduce((acc, item) => {
    const unitPrice = item.product.price.discountedPrice + (item.selectedOption?.surcharge || 0);
    return acc + unitPrice * item.quantity;
  }, 0);
  const shippingFee = subtotal >= 50000 || cartItems.length === 0 ? 0 : 3000;
  const totalPrice = subtotal + shippingFee;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      alert("배송 정보를 모두 입력해 주세요.");
      return;
    }

    alert("결제가 성공적으로 처리되었습니다.");
    clearCart();
    router.push("/order/success");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Order Checkout</h1>

      <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">배송 정보</h2>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">수령인</label>
            <input
              type="text"
              required
              className="w-full border p-2 text-sm rounded focus:outline-none focus:border-black"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">연락처</label>
            <input
              type="tel"
              required
              className="w-full border p-2 text-sm rounded focus:outline-none focus:border-black"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">주소</label>
            <input
              type="text"
              required
              className="w-full border p-2 text-sm rounded focus:outline-none focus:border-black"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold border-b pb-2 mb-4">결제 내역</h2>
          <div className="bg-neutral-50 p-4 rounded space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span>상품 금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span>배송비</span>
              <span>{shippingFee.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>총 결제 금액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 font-medium hover:bg-neutral-800 transition-colors"
          >
            {totalPrice.toLocaleString()}원 결제하기
          </button>
        </div>
      </form>
    </main>
  );
}