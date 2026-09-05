# [PRD] 주문 관리자 (Order Admin)

> 본 문서는 Admin의 주문 조회, 출고, 배송 완료 및 주문 취소 기능을 정의합니다.
>
> 주문 데이터 구조와 상태는 `Order_Summary`를 기준으로 합니다.

---

## 1. 주문 조회

Admin은 전체 주문을 조회할 수 있습니다.

* 주문 목록 조회
* 주문 상태별 조회
* 주문 상세 조회
* 주문 상품 및 Snapshot 조회
* 배송지 정보 조회
* 배송 정보 조회

---

## 2. 출고 처리

`PENDING` 상태의 주문을 출고 처리할 수 있습니다.

```text
PENDING
   ↓
출고 처리
   ↓
배송 정보 등록
   ↓
SHIPPING
```

출고 시 배송 정보를 등록하고 `Order.shippedAt`을 기록합니다.

```ts
export interface OrderDelivery {
    carrier: string;
    trackingNumber: string;
    shippedAt: string;
}
```

---

## 3. 배송 완료

`SHIPPING` 상태의 주문을 배송 완료 처리할 수 있습니다.

```text
SHIPPING
   ↓
COMPLETED
```

배송 완료 시 `Order.completedAt`을 기록합니다.

구체적인 Client 배송 완료 확정 기능은 `Order_User`에서 정의합니다.

---

## 4. 주문 취소

`PENDING` 상태의 주문을 취소할 수 있습니다.

```text
PENDING
   ↓
CANCELLED
```

주문 취소에 필요한 재고 복구는 Inventory 모듈을 통해 처리합니다.

`SHIPPING` 및 `COMPLETED` 상태는 일반적인 Admin 취소 대상에서 제외합니다.

---

## 5. 모듈 연동

### Inventory

주문 취소 시 필요한 재고 복구를 Inventory 모듈을 통해 처리합니다.

### Payment

결제 승인, 결제 상태 및 환불 등의 결제 처리는 Payment 모듈에서 담당합니다.

Order Admin은 `Payment ID`를 통해 결제 정보를 참조합니다.

---

## 6. 권한

Admin만 주문 관리 기능을 사용할 수 있습니다.

* 주문 조회
* 주문 상세 조회
* 출고 처리
* 배송 완료 처리
* 주문 취소

Client의 주문 조회 및 배송 완료 확정 기능은 `Order_User`에서 정의합니다.

---

## 7. 데이터 원칙

* 주문은 물리적으로 삭제하지 않습니다.
* `OrderItem`의 Snapshot 데이터는 이후 Product 또는 Inventory 변경과 무관하게 유지합니다.
* 주문 상태는 `Order_Summary`에서 정의한 흐름을 따릅니다.
