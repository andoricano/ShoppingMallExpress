// app/order/page.tsx

"use client";

import { OrderSection } from "@/components/order/OrderSection";
import { useClientOrderApi } from "@/hooks/useClientOrderApi";

export default function OrderPage() {
  const {
    createOrder,
  } = useClientOrderApi();

  return (
    <OrderSection
      onOrderSubmit={(
        clientId,
        _paymentId,
        items,
        shippingAddress,
      ) =>
        createOrder(
          "TEMP-PAYMENT-ID",
          items,
          shippingAddress,
        )
      }
    />
  );
}