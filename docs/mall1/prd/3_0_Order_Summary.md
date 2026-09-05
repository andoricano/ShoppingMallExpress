# [PRD] 주문 요약 (Order Summary)

> 본 문서는 Order 모듈에서 사용하는 **주문 데이터 구조와 기본 주문 상태**를 정의합니다.
>
> 주문 생성 및 사용자 주문 기능은 `Order_User`, 주문 관리 및 출고 처리는 `Order_Admin`에서 정의합니다.

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
└─ 주문 일시
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

    createdAt: string;
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

* `PENDING`: 결제 및 주문 생성이 완료된 상태
* `SHIPPING`: 출고 및 배송이 진행 중인 상태
* `COMPLETED`: 주문이 완료된 상태
* `CANCELLED`: 주문이 취소된 상태

### 상태 흐름

```text
PENDING
├─→ SHIPPING
│     └─→ COMPLETED
│
└─→ CANCELLED
```

---

## 3. Order Item

주문 당시의 Product 및 Inventory 정보를 Snapshot으로 보존합니다.

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

> Product 또는 Inventory 정보가 이후 변경되더라도 기존 주문의 Snapshot 데이터는 변경되지 않아야 합니다.

---

## 4. 배송지

주문 당시의 배송지 정보를 보존합니다.

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

## 5. 데이터 원칙

* 주문은 `Order`와 `OrderItem[]`으로 구성합니다.
* 주문 상태는 `OrderStatus`를 기준으로 관리합니다.
* 주문 당시 Product 및 Inventory 정보는 `OrderItem`에 Snapshot으로 보존합니다.
* 배송지는 주문 당시 정보를 보존합니다.
* 주문의 물리적 삭제는 제공하지 않습니다.
* 출고 및 배송 정보는 `Order_Admin`에서 관리합니다.
