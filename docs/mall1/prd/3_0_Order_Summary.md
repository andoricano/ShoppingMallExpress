# [PRD] 주문 요약 (Order Summary)

> 본 문서는 Order 모듈에서 사용하는 **주문 데이터 구조와 주문 상태를 정의**합니다.
>
> 주문 생성, 주문 관리, 출고 및 배송 처리 등의 상세 기능은 `Order_User`, `Order_Admin`에서 각각 정의합니다.

---

## 1. Order

주문 하나에 대한 기본 정보를 관리합니다.

```text
Order
├─ Order ID
├─ Client ID
├─ Payment ID
├─ 주문 상태
├─ 총 주문 금액
├─ 배송지
├─ 배송 정보
├─ 주문 일시
├─ 출고 일시
└─ 배송 완료 일시
```

### Type

```ts
export interface Order {
    id: string;

    clientId: string;
    paymentId: string;

    status: OrderStatus;
    totalPrice: number;

    shippingAddress: OrderShippingAddress;
    delivery?: OrderDelivery;

    createdAt: string;
    shippedAt?: string;
    completedAt?: string;
}
```

---

## 2. Order Status

```ts
export type OrderStatus =
    | "PENDING"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELLED";
```

### PENDING

결제가 완료되고 주문이 생성된 상태이며, 출고 처리를 기다립니다.

### SHIPPING

출고 처리가 완료되어 배송 중인 상태입니다.

### COMPLETED

배송 완료가 확정된 최종 상태입니다.

### CANCELLED

정상적인 주문 처리가 중단된 취소 상태입니다.

### 상태 흐름

```text
PENDING
   ├─→ SHIPPING
   │      └─→ COMPLETED
   │
   └─→ CANCELLED
```

---

## 3. Order Item

주문 당시의 Product 및 Inventory 정보를 Snapshot으로 보존합니다.

```text
OrderItem
├─ Order Item ID
├─ Order ID
├─ Product ID
├─ Inventory ID
├─ 상품명
├─ SKU Code
├─ 주문 당시 가격
├─ 주문 수량
└─ 주문 당시 Inventory Meta
```

### Type

```ts
export interface OrderItem {
    id: string;
    orderId: string;

    productId: string;
    inventoryId: string;

    productName: string;
    skuCode: string;
    price: number;
    quantity: number;

    inventoryMeta?: Record<string, unknown>;
}
```

> Product 또는 Inventory의 정보가 이후 변경되거나 삭제되더라도 기존 주문의 Snapshot 데이터는 변경되지 않아야 합니다.

---

## 4. 배송지

주문 시점의 배송 대상 정보를 보존합니다.

```ts
export interface OrderShippingAddress {
    recipient: string;
    phone: string;

    postalCode: string;
    address: string;
    detailAddress?: string;
}
```

---

## 5. 배송 정보

출고 처리와 함께 관리되는 배송 정보입니다.

```ts
export interface OrderDelivery {
    carrier: string;
    trackingNumber: string;
    shippedAt: string;
}
```

---

## 6. Order 구성

최종 주문 데이터는 다음 구조를 가집니다.

```text
Order
├─ 기본 주문 정보
│  ├─ Client
│  ├─ Payment
│  ├─ Status
│  └─ Total Price
│
├─ Shipping Address
│
├─ Delivery
│
└─ OrderItem[]
   ├─ Product Snapshot
   └─ Inventory Snapshot
```

---

## 7. 데이터 원칙

- 주문의 상태는 `OrderStatus`를 기준으로 관리합니다.
- 주문 당시 Product 및 Inventory 정보는 `OrderItem`에 Snapshot으로 보존합니다.
- 주문 배송지는 주문 당시 정보를 보존합니다.
- 배송 정보는 출고 처리 이후 주문에 연결됩니다.
- 주문의 물리적 삭제는 제공하지 않습니다.
