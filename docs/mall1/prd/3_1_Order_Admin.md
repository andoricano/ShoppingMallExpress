# [PRD] 주문 관리자 (Order Admin)

> 본 문서는 Admin이 주문을 조회하고 주문 상태를 관리하며, 출고 및 배송 처리를 수행하기 위한 기능을 정의합니다.
>
> 주문의 기본 데이터 구조와 상태는 `Order_Summary`를 기준으로 합니다.

---

## 1. 주문 관리

Admin은 전체 주문을 관리할 수 있어야 합니다.

### 주문 조회

* 전체 주문 목록 조회
* 주문 상태별 조회
* 주문 상세 조회
* 주문 상품 및 Snapshot 정보 조회
* 배송지 정보 조회
* 배송 정보 조회

```text
Order
├─ Order 정보
├─ OrderItem[]
├─ Shipping Address
└─ Delivery
```

---

## 2. 출고 처리

`PENDING` 상태의 주문은 Admin이 출고 처리할 수 있습니다.

출고 처리 시:

```text
PENDING
   ↓
출고 처리
   ↓
배송 정보 등록
   ↓
SHIPPING
```

Admin은 다음 배송 정보를 등록합니다.

```ts
export interface OrderDelivery {
    carrier: string;
    trackingNumber: string;
    shippedAt: string;
}
```

출고 처리와 동시에 `Order.shippedAt`을 기록합니다.

---

## 3. 배송 완료

`SHIPPING` 상태의 주문은 배송 완료 처리를 할 수 있습니다.

```text
SHIPPING
   ↓
배송 완료
   ↓
COMPLETED
```

배송 완료 시 `Order.completedAt`을 기록합니다.

배송 완료 처리는 Admin 또는 Client의 배송 완료 확정에 의해 수행될 수 있으며, 구체적인 Client 동작은 `Order_User`에서 정의합니다.

---

## 4. 주문 취소

`PENDING` 상태의 주문은 Admin이 취소할 수 있습니다.

```text
PENDING
   ↓
CANCELLED
```

주문 취소 시 필요한 재고 복구는 Inventory 모듈을 통해 처리합니다.

`SHIPPING` 또는 `COMPLETED` 상태의 주문은 일반적인 주문 취소 대상으로 취급하지 않습니다.

---

## 5. 주문 상태 변경

Admin이 수행할 수 있는 상태 변경은 다음과 같습니다.

```text
PENDING
├─→ SHIPPING
└─→ CANCELLED

SHIPPING
└─→ COMPLETED
```

완료되거나 취소된 주문은 이전 상태로 되돌릴 수 없습니다.

---

## 6. Inventory 연동

Admin이 주문을 취소하는 경우 Inventory 모듈과 연동하여 필요한 재고를 복구합니다.

```text
Order
   ↓
CANCELLED
   ↓
Inventory
   ↓
재고 복구
```

재고 변경은 Inventory 모듈의 재고 처리 로직을 사용합니다.

---

## 7. Payment 연동

Order Admin은 결제 자체를 처리하지 않습니다.

* 결제 승인 및 결제 상태는 Payment 모듈에서 관리합니다.
* 결제 취소 및 환불은 Payment 모듈에서 관리합니다.
* Order는 Payment ID를 통해 결제 정보를 참조합니다.

---

## 8. DB 관리

Order 데이터는 다음 구조로 관리합니다.

```text
orders
├─ Order 기본 정보
├─ Client ID
├─ Payment ID
├─ Order Status
├─ Total Price
├─ Shipping Address
├─ Delivery
└─ timestamps

order_items
├─ Order ID
├─ Product ID
├─ Inventory ID
├─ Product Snapshot
└─ Inventory Snapshot
```

Order와 Order Item은 주문 생성 시 하나의 주문 단위로 관리되어야 합니다.

---

## 9. 권한

### Admin

* 전체 주문 조회
* 주문 상세 조회
* 주문 상태 확인
* 출고 처리
* 배송 정보 등록
* 배송 완료 처리
* 주문 취소 처리

### Client

Admin 주문 관리 기능을 사용할 수 없습니다.

---

## 10. 주요 원칙

* Order는 물리적으로 삭제하지 않습니다.
* Admin은 허용된 상태 흐름에 따라서만 주문 상태를 변경합니다.
* 출고 처리 시 배송 정보를 기록합니다.
* 배송 완료 시 완료 시간을 기록합니다.
* 주문 취소에 필요한 재고 복구는 Inventory 모듈을 통해 처리합니다.
* 결제 및 환불 처리는 Payment 모듈의 책임입니다.
* 기존 Order Item Snapshot은 Product 또는 Inventory 변경에 영향을 받지 않습니다.
