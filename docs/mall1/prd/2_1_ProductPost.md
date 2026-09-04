# [PRD] 상품 게시물 모듈 (Product Post) - Admin Focused

> 본 모듈은 **상품 게시물과 해당 게시물에 포함되는 Product를 함께 관리하고 구매자에게 상품 정보를 제공하는 모듈**입니다.
>
> Product는 독립적인 CRUD 대상이 아니며, **ProductPost를 통해 생성·수정·제거됩니다.**
>
> 상품의 SKU 및 재고 정보는 Inventory 모듈에서 관리합니다.

---

## 1. 개요 (Overview)

어드민에서 상품 게시물을 생성하고, 하나 이상의 Product를 구성하여 구매자에게 상품 페이지를 제공합니다.

상품 게시물은 게시물의 제목, 썸네일, 이미지, 상세 설명, 태그, 게시 상태 및 메타 정보를 관리합니다.

Product는 상품 게시물에 포함되는 **실제 구매 단위**이며, Product 자체를 별도의 관리 화면이나 CRUD API로 관리하지 않습니다.

하나의 상품 게시물은 하나 이상의 Product를 포함할 수 있으며, 각 Product는 하나의 Inventory와 연결됩니다.

---

## 2. 관리 데이터 (Data Scope)

### 2.1 게시물 정보

* Product Post ID
* 게시물 제목
* 썸네일 정보
* 게시물 이미지
* 상세 설명
* 태그
* 조회수
* 게시 상태
* 게시 일시
* 생성 일시
* 수정 일시
* 메타 정보

### 2.2 상품 구성 정보

* Product ID
* 상품명
* 대표 이미지
* 추가 이미지
* 상품 설명
* 가격
* Inventory ID
* 상품 표시 순서

> Product 정보는 ProductPost 작성 및 수정 과정에서 함께 관리합니다.
>
> SKU 코드, SKU 메타 정보 및 재고 수량은 Inventory 모듈에서 관리합니다.

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 상품 게시물 등록

* 어드민이 상품 게시물을 등록할 수 있어야 합니다.
* 게시물 제목, 썸네일, 이미지 및 상세 설명을 등록할 수 있어야 합니다.
* Tiptap 기반의 상세 설명을 작성할 수 있어야 합니다.
* 하나 이상의 Product를 게시물에 추가할 수 있어야 합니다.
* Product 추가 시 Inventory를 선택하고 상품명, 이미지, 설명 및 가격을 입력할 수 있어야 합니다.
* 작성 중인 Product는 임시 데이터로 관리할 수 있어야 합니다.
* Product는 상품 게시물이 저장될 때 실제 데이터로 생성되어야 합니다.
* 연결된 Product의 표시 순서를 지정할 수 있어야 합니다.
* 태그 및 게시물 메타 정보를 관리할 수 있어야 합니다.
* 신규 게시물은 비공개 상태로 생성할 수 있습니다.

### 3.2 상품 게시물 조회

#### Admin

* 전체 상품 게시물 조회
* 상품 게시물 상세 조회
* 제목 및 태그 기준 조회
* 연결된 Product 조회
* Product 상세 정보 조회
* 게시 상태 조회
* 조회수 및 게시 일시 조회

#### Client

* 공개된 상품 게시물 조회
* 상품 게시물 상세 조회
* 게시물 썸네일 및 이미지 조회
* 상세 설명 조회
* 연결된 Product 정보 조회
* 구매 가능한 Product 정보 조회

> Client의 Product 조회는 Product를 독립 리소스로 관리하기 위한 목적이 아니라 **상품 게시물에 포함된 구매 상품 정보를 제공하기 위한 조회**입니다.

### 3.3 상품 게시물 수정

* 게시물 제목, 썸네일, 이미지 및 상세 설명을 수정할 수 있어야 합니다.
* 태그 및 메타 정보를 수정할 수 있어야 합니다.
* 기존 Product의 상품명, 이미지, 설명 및 가격을 수정할 수 있어야 합니다.
* 새로운 Product를 추가할 수 있어야 합니다.
* 기존 Product를 게시물 구성에서 제거할 수 있어야 합니다.
* 연결된 Product의 표시 순서를 변경할 수 있어야 합니다.
* 게시 상태를 변경할 수 있어야 합니다.

### 3.4 상품 게시

* 게시물을 공개 상태로 변경할 수 있어야 합니다.
* 공개된 게시물은 Client에서 조회할 수 있습니다.
* 비공개 게시물은 Client에 노출하지 않습니다.
* 게시물에 포함된 Product의 Inventory 상태 및 재고 정보를 기준으로 구매 가능 여부를 판단합니다.
* 구매할 수 없는 Product는 게시물에서 구매 제한 상태로 표시할 수 있어야 합니다.

### 3.5 상품 게시 중지

* 공개된 게시물을 비공개 상태로 변경할 수 있어야 합니다.
* 비공개 상태의 게시물은 Client에서 조회할 수 없어야 합니다.
* 게시물을 비공개로 변경해도 Product 및 Inventory 데이터는 변경하지 않습니다.

### 3.6 Product 관리

* Product는 ProductPost에서만 생성할 수 있어야 합니다.
* Product는 ProductPost에서만 수정할 수 있어야 합니다.
* Product는 독립적인 CRUD API 및 관리 화면을 제공하지 않습니다.
* Product를 게시물 구성에서 추가하거나 제거할 수 있어야 합니다.
* Product 제거 시 다른 데이터에서 참조 중인 Product를 임의로 삭제하지 않아야 합니다.
* Product의 판매 활성/비활성 상태는 별도로 관리하지 않습니다.
* Product의 구매 가능 여부는 연결된 Inventory의 활성 상태와 현재 재고를 기준으로 판단합니다.
* 연결된 Inventory가 비활성화된 Product는 ProductPost에서 판매 및 노출 대상에서 제외해야 합니다.

### 3.7 Inventory 연동

* 하나의 Product는 하나의 Inventory와 연결됩니다.
* Product 생성 시 Inventory를 선택해야 합니다.
* Inventory의 SKU 정보 및 재고 수량은 Inventory 모듈에서 관리합니다.
* Product는 Inventory의 현재 상태를 조회하여 구매 가능 여부를 판단합니다.
* Inventory 정보 자체는 ProductPost에서 직접 수정하지 않습니다.

---

## 4. 권한 (Permissions)

* **Super Admin**: 모든 상품 게시물 및 포함 Product 조회·관리
* **Store Operator**: 허용된 상품 게시물 및 포함 Product 조회·관리
* **Customer**: 공개된 상품 게시물 및 구매 가능한 Product 조회만 가능

> Product에 대한 관리 권한은 ProductPost 관리 권한에 포함됩니다.

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

### 5.1 접근 제어

* 상품 게시물 관리 API는 어드민 권한 사용자만 사용할 수 있어야 합니다.
* Product 관리 기능은 별도 API가 아닌 ProductPost 관리 API를 통해서만 제공됩니다.
* Client API는 공개된 상품 게시물과 그에 포함된 Product의 조회 기능만 제공합니다.
* Client에서는 Product 및 ProductPost를 직접 수정할 수 없어야 합니다.

### 5.2 데이터 일관성

* ProductPost와 Product의 연결 관계를 유지해야 합니다.
* Product와 Inventory의 1:1 연결 관계를 유지해야 합니다.
* ProductPost 생성 시 생성되는 Product는 동일한 저장 작업에서 함께 처리해야 합니다.
* ProductPost 저장이 실패한 경우 생성 예정 Product도 저장되지 않아야 합니다.
* 기존 주문에 사용된 Product 정보는 OrderItem Snapshot을 통해 보존해야 합니다.
* ProductPost의 비공개 전환은 Product 및 Inventory의 상태를 변경하지 않습니다.

### 5.3 데이터 책임 분리

* **ProductPost**: 게시물 콘텐츠, 노출 정보 및 Product 관리
* **Product**: 실제 구매 상품 정보
* **Inventory**: SKU 및 재고 정보
* **Order**: 주문 시점의 Product 정보 Snapshot

> Product는 독립적인 관리 모듈이 아니라 **ProductPost에 종속된 구매 상품 데이터**입니다.
