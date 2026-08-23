"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/useOrderStore";

export default function OrderCartPage() {
  const router = useRouter();
  const { cartItems, removeCartItem, updateCartQuantity } = useOrderStore();

  const subtotal = cartItems.reduce((acc, item) => {
    const unitPrice = item.product.price.discountedPrice + (item.selectedOption?.surcharge || 0);
    return acc + unitPrice * item.quantity;
  }, 0);

  const shippingFee = subtotal >= 50000 || cartItems.length === 0 ? 0 : 3000;
  const totalPrice = subtotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">장바구니가 비어 있습니다.</h1>
        <p className="text-neutral-500 mb-8">마음에 드는 상품을 담아보세요!</p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800"
        >
          상품 둘러보기
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Order Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* 장바구니 품목 리스트 */}
        <div className="lg:col-span-2 divide-y divide-neutral-200 border-y border-neutral-200">
          {cartItems.map((item) => {
            const unitPrice = item.product.price.discountedPrice + (item.selectedOption?.surcharge || 0);
            return (
              <div key={item.orderItemId} className="py-6 flex gap-4 items-center">
                <img
                  src={item.product.mainImageUrl}
                  alt={item.product.productName}
                  className="w-20 h-20 object-cover bg-neutral-100 flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-neutral-900">
                    {item.product.productName}
                  </h3>
                  {item.selectedOption && (
                    <p className="text-xs text-neutral-500 mt-1">
                      옵션: {item.selectedOption.optionName} - {item.selectedOption.optionValue}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-2">
                    {unitPrice.toLocaleString()}원
                  </p>
                </div>

                {/* 수량 조절 */}
                <div className="flex items-center border border-neutral-300 rounded">
                  <button
                    onClick={() => updateCartQuantity(item.orderItemId, item.quantity - 1)}
                    className="px-2 py-0.5 text-sm hover:bg-neutral-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-0.5 text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.orderItemId, item.quantity + 1)}
                    className="px-2 py-0.5 text-sm hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeCartItem(item.orderItemId)}
                  className="text-xs text-neutral-400 hover:text-black ml-4"
                >
                  삭제
                </button>
              </div>
            );
          })}
        </div>

        {/* 결제 내역 요약 */}
        <div className="bg-neutral-50 p-6 rounded h-fit">
          <h2 className="text-lg font-bold mb-4">주문 결제 금액</h2>
          <div className="space-y-3 text-sm border-b border-neutral-200 pb-4 mb-4">
            <div className="flex justify-between">
              <span className="text-neutral-600">총 상품 금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">배송비</span>
              <span>{shippingFee === 0 ? "무료" : `${shippingFee.toLocaleString()}원`}</span>
            </div>
          </div>

          <div className="flex justify-between text-base font-bold mb-6">
            <span>최종 결제 금액</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>

          <button
            onClick={() => router.push("/order/checkout")}
            className="w-full bg-black text-white py-4 text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            주문하기
          </button>
        </div>
      </div>
    </main>
  );
}