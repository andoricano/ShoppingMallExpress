# [PRD] 주문 사용자 (Order Client)

> 본 문서는 Client의 주문 생성, 주문 조회 및 배송 완료 확정 기능을 정의합니다.
>
> 주문 데이터 구조는 `Order_Summary`, 주문 관리 및 출고 처리는 `Order_Admin`을 기준으로 합니다.

---

## 1. 주문 생성

Client는 결제를 완료한 후 주문 생성을 요청합니다.

```text
Product
   ↓
결제
   ↓
Payment 완료
   ↓
Order 생성 요청
```

Client는 다음 정보를 전달합니다.

```text
Payment ID
Product ID
주문 수량
배송지
```

서버는 Product와 Inventory를 확인하여 주문 데이터를 구성합니다.

Client가 상품명, 가격, SKU Code, Inventory 등의 주문 데이터를 직접 결정할 수 없습니다.

---

## 2. 주문 조회

Client는 자신의 주문만 조회할 수 있습니다.

### 주문 목록

* 주문 목록
* 주문 상태
* 주문 금액
* 주문 일시

### 주문 상세

* 주문 정보
* 주문 상품 및 Snapshot
* 배송지
* 배송 정보
* 주문 상태

다른 Client의 주문은 조회할 수 없습니다.

---

## 3. 배송 완료 확정

`SHIPPING` 상태의 주문에 대해 Client가 배송 완료를 확정할 수 있습니다.

```text
SHIPPING
   ↓
배송 완료 확정
   ↓
COMPLETED
```

`COMPLETED` 또는 `CANCELLED` 상태에서는 배송 완료 확정을 수행할 수 없습니다.

---

## 4. Payment 연동

주문 생성은 결제 완료 이후에 수행합니다.

Order 생성 API는 `Payment ID`를 기준으로 결제 상태를 확인하며, 결제가 완료되지 않은 경우 주문을 생성하지 않습니다.

결제 처리 및 환불은 Payment 모듈에서 담당합니다.

---

## 5. 권한

Client는 자신의 주문에 대해서만 다음 기능을 사용할 수 있습니다.

* 주문 생성
* 주문 조회
* 배송 상태 확인
* 배송 완료 확정

주문 상태의 임의 변경 및 다른 Client의 주문 조회는 허용하지 않습니다.
