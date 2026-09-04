# [PRD] 상품 관리 모듈 (Product Management)

> 본 모듈은 **상품 게시물에서 사용하는 Product 데이터의 구조와 관리 범위**를 정의합니다.
>
> Product는 독립적인 CRUD 대상이 아니며, **ProductPost를 통해 생성·수정·제거됩니다.**
>
> 상품별 SKU 및 재고 수량은 **Inventory 모듈**에서 관리하며, 본 모듈에서는 재고 수량을 직접 관리하지 않습니다.

---

## 1. 개요 (Overview)

Product는 ProductPost에 포함되는 **실제 구매 단위**입니다.

Product는 독립적인 관리 대상이 아니며, ProductPost 작성 및 수정 과정에서 관리됩니다.

하나의 Product는 하나의 Inventory와 연결되며, **하나의 Inventory는 여러 Product에서 참조될 수 있습니다.**

Product의 구매 가능 여부는 연결된 Inventory의 상태 및 재고를 기준으로 판단합니다.

---

## 2. 관리 데이터 (Data Scope)

### 2.1 상품 정보

* Product ID
* 상품명
* 대표 이미지
* 추가 이미지
* 상품 설명
* 가격
* Inventory ID

### 2.2 Inventory 연동 정보

* Inventory ID
* SKU 코드
* SKU 메타 정보
* 현재 재고 수량
* Inventory 활성 상태

> SKU 코드, 메타 정보 및 재고 수량은 Inventory 모듈에서 관리합니다.
>
> Product는 연결된 Inventory의 정보를 조회하여 구매 상품 정보를 구성합니다.

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 Product 생성

* Product는 ProductPost 작성 과정에서 생성할 수 있어야 합니다.
* Product 생성 시 기존 Inventory를 선택할 수 있어야 합니다.
* 하나의 Inventory를 여러 Product에서 사용할 수 있어야 합니다.
* Product 생성 중인 데이터는 임시 상태로 관리할 수 있어야 합니다.
* ProductPost 저장 시 실제 Product 데이터가 생성되어야 합니다.

### 3.2 Product 조회

* Product는 독립적인 조회 대상이 아닙니다.
* Admin에서는 ProductPost에 포함된 Product 정보를 조회할 수 있어야 합니다.
* Client에서는 ProductPost에 포함된 Product 정보를 조회할 수 있어야 합니다.
* Product의 구매 가능 여부는 연결된 Inventory 상태 및 재고를 기준으로 판단합니다.

### 3.3 Product 수정

* Product는 ProductPost 수정 과정에서 수정할 수 있어야 합니다.
* 상품명, 이미지, 설명 및 가격 등의 정보를 수정할 수 있어야 합니다.
* 연결된 Inventory를 변경할 수 있어야 합니다.
* Product 자체의 독립적인 수정 API 및 관리 화면은 제공하지 않습니다.

### 3.4 Product 제거

* Product는 ProductPost의 상품 구성에서 제거할 수 있어야 합니다.
* ProductPost에서 Product를 제거해도 Product 데이터 자체는 임의로 삭제하지 않습니다.
* Product가 다른 ProductPost에서 사용 중인 경우 기존 연결 관계를 유지해야 합니다.

### 3.5 Inventory 연동

* 하나의 Product는 하나의 Inventory와 연결됩니다.
* 하나의 Inventory는 여러 Product에서 참조될 수 있습니다.
* Product 생성 시 기존 Inventory를 선택할 수 있어야 합니다.
* Inventory의 SKU 정보 및 재고 수량은 Inventory 모듈에서 관리합니다.
* ProductPost에서는 Inventory 정보를 직접 수정하지 않습니다.
* 연결된 Inventory가 비활성 상태인 경우 해당 Product는 판매 및 노출 대상에서 제외할 수 있어야 합니다.

---

## 4. 권한 (Permissions)

* Product 자체의 독립적인 CRUD 권한은 제공하지 않습니다.
* Product에 대한 관리 권한은 ProductPost 관리 권한에 포함됩니다.
* **Super Admin**: 모든 ProductPost 및 포함 Product 조회·관리
* **Store Operator**: 허용된 ProductPost 및 포함 Product 조회·관리
* **Customer**: 공개된 ProductPost 및 구매 가능한 Product 조회만 가능

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

### 5.1 접근 제어

* Product 관리 기능은 ProductPost 관리 API를 통해서만 제공합니다.
* Product 독립적인 CRUD API는 제공하지 않습니다.
* Client에서는 Product 데이터를 직접 수정할 수 없어야 합니다.

### 5.2 데이터 무결성

* Product와 Inventory는 **1:N 관계**를 유지해야 합니다.
* 하나의 Inventory는 여러 Product에서 참조될 수 있어야 합니다.
* ProductPost와 Product의 연결 관계를 유지해야 합니다.
* ProductPost 생성 시 생성되는 Product는 동일한 저장 작업에서 함께 처리해야 합니다.
* ProductPost 저장이 실패한 경우 생성 예정 Product도 저장되지 않아야 합니다.
* 기존 주문의 상품 정보는 OrderItem Snapshot을 통해 보존해야 합니다.

### 5.3 데이터 책임 분리

* **ProductPost**: 게시물 콘텐츠, 노출 정보 및 Product 관리
* **Product**: 실제 구매 상품 정보
* **Inventory**: SKU 및 재고 정보
* **Order**: 주문 시점의 Product 정보 Snapshot

> Product는 독립적인 관리 모듈이 아니라 **ProductPost에 종속된 구매 상품 데이터**입니다.
