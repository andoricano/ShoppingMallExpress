# [PRD] 주문 사용자 (Order User)

> 본 문서는 Client가 자신의 주문을 생성하고 조회하며 배송 완료를 확정하기 위한 기능을 정의합니다.
>
> 주문의 기본 데이터와 상태는 `Order_Summary`, 주문의 실제 처리 및 관리는 `Order_Admin`을 기준으로 합니다.

---

## 1. 주문 생성

Client는 Product 구매 과정에서 결제를 완료한 후 주문 생성을 요청합니다.

```text
Product
   ↓
결제 정보 입력
   ↓
Payment 완료
   ↓
Order 생성 요청
```

Client가 전달하는 주문 생성 정보:

```text
Payment ID
Product ID
주문 수량
배송지
```

서버는 요청 정보를 기준으로 Product 및 Inventory를 조회하여 실제 주문 데이터를 구성합니다.

Client가 가격, 상품명, SKU Code, Inventory 정보 등을 직접 결정할 수 없습니다.

---

## 2. 주문 조회

Client는 자신이 생성한 주문만 조회할 수 있습니다.

### 주문 목록

* 자신의 주문 목록 조회
* 주문 상태 확인
* 주문 금액 확인
* 주문 일시 확인

### 주문 상세

* 주문 기본 정보 조회
* 주문 상품 조회
* 주문 당시 Product Snapshot 조회
* 주문 당시 Inventory Snapshot 조회
* 배송지 조회
* 배송 정보 조회
* 주문 상태 조회

다른 Client의 주문은 조회할 수 없습니다.

---

## 3. 배송 완료

`SHIPPING` 상태의 주문에 대해 Client가 배송 완료를 확정할 수 있습니다.

```text
SHIPPING
   ↓
배송 완료 확정
   ↓
COMPLETED
```

`COMPLETED` 또는 `CANCELLED` 상태의 주문은 배송 완료 처리를 수행할 수 없습니다.

---

## 4. 주문 상태 관리

Client는 주문 상태를 직접 지정하거나 임의로 변경할 수 없습니다.

```text
Client
   ↓
배송 완료 확정

Admin
   ↓
출고 / 취소

Server
   ↓
상태 검증 및 변경
```

Client가 변경할 수 있는 주문 상태는 배송 완료 확정에 따른:

```text
SHIPPING → COMPLETED
```

뿐입니다.

---

## 5. Payment 연동

주문 생성 요청은 결제 완료 이후에 수행합니다.

```text
Payment
   ↓
결제 완료
   ↓
Order User
   ↓
주문 생성 요청
```

Order 생성 API에서는 Payment ID를 기준으로 결제 상태를 확인해야 합니다.

결제가 완료되지 않은 경우 주문을 생성하지 않습니다.

결제 취소 및 환불은 Payment 모듈에서 처리합니다.

---

## 6. Inventory / Product 연동

Client는 Product와 Inventory의 실제 관리 데이터를 직접 입력하지 않습니다.

주문 생성 시 서버가:

```text
Payment
   ↓
결제 확인

Product
   ↓
상품 정보 확인

Inventory
   ↓
SKU / 재고 확인

Order
   ↓
주문 생성
```

순서로 필요한 데이터를 구성합니다.

주문 당시 Product 및 Inventory 정보는 `OrderItem` Snapshot으로 저장합니다.

---

## 7. 권한

Client는 다음 기능만 사용할 수 있습니다.

* 주문 생성 요청
* 자신의 주문 목록 조회
* 자신의 주문 상세 조회
* 자신의 배송 상태 조회
* 배송 완료 확정

다른 Client의 주문 조회 및 주문 상태의 임의 변경은 허용하지 않습니다.
