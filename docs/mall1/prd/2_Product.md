# [PRD] 상품 관리 모듈 (Product Management) - Admin Focused

> 본 모듈은 **상품 정보를 관리하고 구매자에게 판매 상품 정보를 제공하는 모듈**입니다.
>
> 상품별 SKU 및 재고 수량은 **Inventory 모듈**에서 관리하며, 본 모듈에서는 재고 수량을 직접 관리하지 않습니다.

---

## 1. 개요 (Overview)

어드민에서 판매 상품의 기본 정보, 가격 및 연결된 Inventory를 관리하고,
활성화된 상품을 구매자에게 Read-Only로 제공합니다.

하나의 Product는 하나의 Inventory와 연결됩니다.

Product와 Inventory의 활성 상태에 따라 상품의 판매 및 노출 여부를 관리합니다.

---

## 2. 관리 데이터 (Data Scope)

### 2.1 상품 정보

* Product ID
* 상품명
* 상품 코드
* 대표 이미지
* 추가 이미지
* 상품 설명
* 가격
* 활성 상태
* Inventory ID

### 2.2 Inventory 연동 정보

* Inventory ID
* SKU 코드
* SKU 메타 정보
* 현재 재고 수량
* Inventory 활성 상태

> SKU 코드, 메타 정보 및 재고 수량은 Inventory 모듈에서 관리합니다.
>
> Product는 연결된 Inventory의 정보를 조회하여 판매 상품 정보를 구성합니다.

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 상품 등록

* 어드민이 상품을 등록할 수 있어야 합니다.
* 상품명, 상품 코드, 이미지, 설명, 가격 등의 기본 정보를 등록할 수 있어야 합니다.
* 활성 상태의 Inventory만 상품에 연결할 수 있어야 합니다.
* 신규 상품은 활성 상태로 생성할 수 있어야 합니다.

### 3.2 상품 조회

#### Admin

* 전체 상품 목록 조회
* 상품명 및 상품 코드 검색
* 상품 상세 정보 조회
* 연결된 Inventory 정보 조회
* 활성 및 비활성 상품 조회

#### Client

* 활성 상태의 상품 조회
* 상품 목록 및 상세 정보 조회
* 상품 정보를 Read-Only로 조회

### 3.3 상품 수정

* 상품명, 상품 코드, 이미지, 설명, 가격 등의 정보를 수정할 수 있어야 합니다.
* 연결된 Inventory를 변경할 수 있어야 합니다.
* 상품 활성 상태를 변경할 수 있어야 합니다.
* 비활성 상태의 Inventory는 신규 연결 대상으로 사용할 수 없습니다.

### 3.4 상품 비활성화

* 더 이상 판매하지 않는 상품은 `isActive = false`로 비활성화할 수 있어야 합니다.
* 상품 비활성화는 언제든지 수행할 수 있어야 합니다.
* 비활성화된 상품은 Client에 노출하지 않습니다.
* 비활성화된 상품은 Admin에서 계속 조회 및 관리할 수 있습니다.
* 기존 주문 등에서 참조되는 상품 정보는 주문 데이터에 보존되어야 합니다.

### 3.5 상품 삭제

* Product는 `isActive = false` 상태에서만 삭제할 수 있습니다.
* 활성 상태의 Product는 삭제할 수 없습니다.
* 삭제된 Product는 Client에 노출되지 않습니다.
* Product 삭제 이후에도 기존 주문의 주문 정보가 변경되거나 손상되지 않아야 합니다.
* 주문 당시의 상품명, 가격 및 옵션 정보는 Order Item의 Snapshot 데이터로 유지합니다.

### 3.6 Inventory 연동

* 하나의 Product는 하나의 Inventory와 연결됩니다.
* 하나의 Inventory가 Product에 연결되어 있는 경우 해당 Inventory를 삭제할 수 없습니다.
* 연결된 Inventory가 비활성화되면 Inventory API를 통해 해당 Product도 비활성화합니다.
* Inventory가 다시 활성화되더라도 Product의 활성화 여부는 별도로 관리할 수 있어야 합니다.
* Product가 비활성화되어도 연결된 Inventory는 유지됩니다.

---

## 4. 권한 (Permissions)

* **Super Admin**: 모든 상품 조회 및 관리
* **Store Operator**: 허용된 상품 조회 및 관리
* **Customer**: 활성 상품 조회만 가능하며 관리 기능은 사용할 수 없습니다.

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

### 5.1 접근 제어

* 상품 관리 API는 어드민 권한을 가진 사용자만 사용할 수 있어야 합니다.
* Client API는 상품 조회 기능만 제공합니다.
* Client에서는 상품 데이터를 직접 수정할 수 없어야 합니다.

### 5.2 데이터 무결성

* Product와 Inventory의 연결 관계를 유지해야 합니다.
* 비활성화된 Inventory는 신규 Product 연결 대상에서 제외합니다.
* 활성 상태의 Product는 언제든지 비활성화할 수 있어야 합니다.
* Product 삭제는 반드시 비활성 상태에서만 수행할 수 있어야 합니다.
* 기존 주문의 상품 정보는 Product 삭제 이후에도 유지되어야 합니다.
