// app/order/page.tsx

"use client";

import { OrderSection } from "@/components/order/OrderSection";
import { useClientOrder } from "@/hooks/useClientOrder";

export default function OrderPage() {
  const {
    items,
    selectedItems,
    selectedItemIds,
    shippingAddress,
    productPrice,

    selectItem,
    handleQuantityChange,
    handleRemove,
    handleAddressChange,

    submitOrder,
  } = useClientOrder();

  return (
    <OrderSection
      items={items}
      selectedItemIds={
        selectedItemIds
      }
      shippingAddress={
        shippingAddress
      }
      productPrice={productPrice}
      onSelect={selectItem}
      onQuantityChange={
        handleQuantityChange
      }
      onRemove={handleRemove}
      onAddressChange={
        handleAddressChange
      }
      onSubmit={submitOrder}
    />
  );
}