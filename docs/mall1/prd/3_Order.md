# [PRD] 주문 관리 모듈 (Order Management)

> 본 모듈은 **Client의 상품 구매부터 Admin의 출고 처리 및 배송 완료까지의 주문 생명주기**를 관리합니다.
>
> 결제는 **Payment 모듈**, 상품 정보는 **Product 모듈**, 재고는 **Inventory 모듈**에서 관리하며, Order는 각 모듈과 연동하여 주문을 생성하고 상태를 관리합니다.
>
> 본 모듈에서는 **환불, 교환, 반품 등의 클레임 기능을 제공하지 않습니다.**

---

## 1. 개요 (Overview)

Client가 상품 구매를 진행하면 Payment 모듈의 결제 완료를 확인한 후 주문을 생성합니다.

주문 생성 과정에서 주문 상품에 필요한 Inventory 재고를 차감하며, 재고가 부족한 경우 주문을 생성하지 않습니다.

Admin은 생성된 주문을 확인하여 출고 처리하고, 배송이 완료된 주문은 Client가 배송 완료를 확정하면 주문을 완료 상태로 변경합니다.

### Order Flow

```text
상품 선택
    ↓
Payment 완료
    ↓
Order 생성
+ Inventory 재고 차감
    ↓
PENDING
(출고 대기)
    ↓
Admin 출고 처리
    ↓
SHIPPING
(배송 중)
    ↓
Client 배송 완료
    ↓
COMPLETED
```

---

## 2. 관리 데이터 (Data Scope)

### 2.1 Order

* Order ID
* Client ID
* 주문 상태
* 총 주문 금액
* Payment ID
* 주문 일시
* 출고 일시
* 배송 완료 일시

### 2.2 Order Item

* Order Item ID
* Order ID
* Product ID
* Inventory ID
* 상품명
* 주문 당시 가격
* 주문 수량
* 주문 당시 SKU 코드
* 주문 당시 Inventory Meta 정보

> 주문 시점의 상품 및 재고 정보를 Snapshot으로 저장하여 이후 Product 또는 Inventory 정보가 변경되어도 기존 주문 데이터가 변경되지 않도록 합니다.

---

## 3. 주문 상태 (Order Status)

```ts
PENDING
SHIPPING
COMPLETED
CANCELLED
```

### PENDING

* 결제가 완료되고 주문이 생성된 상태입니다.
* Inventory 재고 차감이 완료된 상태입니다.
* Admin의 출고 처리를 기다리는 상태입니다.

### SHIPPING

* Admin이 출고 처리를 완료한 상태입니다.
* Client에게 배송 중인 상태입니다.

### COMPLETED

* Client가 배송 완료를 확정한 상태입니다.
* 주문의 정상적인 최종 상태입니다.

### CANCELLED

* 주문이 정상적으로 진행될 수 없어 취소된 상태입니다.
* 취소 과정에서 필요한 재고 복구는 Inventory 모듈을 통해 처리합니다.

> 결제 취소 및 환불은 Payment 모듈의 책임이며, 본 모듈에서는 처리하지 않습니다.

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 주문 생성

* Payment 모듈의 결제 완료 여부를 확인한 후 주문을 생성합니다.
* 주문 생성 시 Order ID를 발급합니다.
* 주문 상품별 Order Item을 생성합니다.
* 주문 상태를 `PENDING`으로 설정합니다.
* 주문 생성 시 Inventory 재고를 주문 수량만큼 차감합니다.
* 재고가 부족한 경우 주문을 생성하지 않습니다.
* 주문 생성과 재고 차감 및 Order Item 생성을 하나의 트랜잭션으로 처리합니다.
* 주문 시점의 상품명, 가격, SKU 코드 및 Inventory Meta 정보를 Order Item에 Snapshot으로 저장합니다.
* 동일한 Payment에 대해 중복 주문이 생성되지 않아야 합니다.

### 4.2 Client 주문 조회

* 로그인한 Client는 자신의 주문 목록을 조회할 수 있어야 합니다.
* 자신의 주문 상세 정보를 조회할 수 있어야 합니다.
* 주문 상태를 확인할 수 있어야 합니다.
* 배송 중인 주문의 배송 상태를 확인할 수 있어야 합니다.
* 배송 중인 주문에 대해 배송 완료를 확정할 수 있어야 합니다.
* 다른 Client의 주문은 조회할 수 없어야 합니다.

### 4.3 Admin 주문 관리

* Admin은 전체 주문 목록을 조회할 수 있어야 합니다.
* 주문 상태별 주문을 조회할 수 있어야 합니다.
* 주문 상세 정보 및 Order Item을 조회할 수 있어야 합니다.
* `PENDING` 주문을 출고 처리하여 `SHIPPING` 상태로 변경할 수 있어야 합니다.
* 필요한 경우 주문을 `CANCELLED` 상태로 변경할 수 있어야 합니다.
* 주문 취소에 따른 재고 복구는 Inventory 모듈을 통해 처리합니다.

### 4.4 배송 완료

* Client는 `SHIPPING` 상태의 주문에 대해 배송 완료를 확정할 수 있어야 합니다.
* 배송 완료 확정 시 주문 상태를 `COMPLETED`로 변경합니다.
* `COMPLETED` 상태의 주문은 다시 이전 상태로 변경할 수 없습니다.

### 4.5 Inventory 연동

* 주문 생성 시 주문 상품에 연결된 Inventory의 재고를 차감합니다.
* 재고 차감은 Inventory 모듈의 재고 변경 기능을 통해 처리합니다.
* 재고 부족 시 주문 생성을 거부합니다.
* 주문이 취소되는 경우 필요한 재고 복구는 Inventory 모듈을 통해 처리합니다.
* 동시에 여러 주문이 생성되는 경우에도 재고가 음수가 되지 않아야 합니다.

### 4.6 Product 연동

* 주문 생성 시 구매 대상 Product의 정보를 조회합니다.
* 주문 상품은 Product의 연결된 Inventory를 기준으로 재고를 처리합니다.
* 주문 생성 시 Product 정보를 그대로 참조하지 않고 주문 시점의 상품 정보를 Order Item Snapshot으로 저장합니다.
* Product가 이후 수정되거나 삭제되어도 기존 주문 정보에는 영향을 주지 않아야 합니다.

### 4.7 Payment 연동

* 주문 생성 전에 Payment 모듈을 통해 결제 완료 여부를 확인합니다.
* 결제가 완료되지 않은 경우 정상 주문을 생성하지 않습니다.
* 동일한 Payment에 대해 중복 Order가 생성되지 않아야 합니다.
* 결제 취소 및 환불 처리는 Payment 모듈에서 담당합니다.

---

## 5. 권한 (Permissions)

### Client

* 자신의 주문 목록 조회
* 자신의 주문 상세 조회
* 자신의 주문 상태 조회
* 배송 완료 확정

### Admin

* 전체 주문 조회
* 주문 상세 조회
* 출고 처리
* 주문 취소 처리

---

## 6. 비기능 요구사항 (Non-Functional Requirements)

### 6.1 접근 제어

* Client는 자신의 주문 데이터만 조회할 수 있어야 합니다.
* Admin은 권한에 따라 주문 관리 기능을 사용할 수 있어야 합니다.
* Client는 주문 상태를 임의로 변경할 수 없습니다.

### 6.2 데이터 일관성

* Order와 Order Item은 주문 생성 시 일관된 상태로 생성되어야 합니다.
* 주문 생성과 재고 차감은 하나의 트랜잭션으로 처리되어야 합니다.
* 주문 상태 변경은 허용된 상태 흐름을 따라야 합니다.

```text
PENDING → SHIPPING → COMPLETED
PENDING → CANCELLED
```

* `COMPLETED` 상태의 주문은 이전 상태로 되돌릴 수 없습니다.
* `CANCELLED` 상태의 주문은 정상 주문 상태로 되돌릴 수 없습니다.

### 6.3 중복 처리 방지

* 동일한 Payment에 대해 중복 Order가 생성되지 않아야 합니다.
* 동일한 Order에 대한 출고 처리가 중복 실행되지 않아야 합니다.
* 동일한 Order에 대한 배송 완료 처리가 중복 실행되지 않아야 합니다.
* 동일한 주문 취소 처리가 중복 실행되지 않아야 합니다.
