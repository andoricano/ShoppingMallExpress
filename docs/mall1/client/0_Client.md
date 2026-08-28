# [PRD] Client 관리 모듈 (Client)

> 본 모듈은 **Client의 인증 및 구매 보조 데이터를 관리하는 모듈**입니다.
>
> 인증은 **Supabase Google SDK**를 사용하며, Client를 기준으로 Cart와 Wishlist를 관리합니다.
>
> 상품 정보와 주문 정보 자체는 각각 **Product / Order 모듈**에서 관리합니다.

---

## 1. 개요 (Overview)

Client의 인증 및 기본 데이터를 관리하고,
Client가 상품을 구매하기 전에 사용하는 Cart와 Wishlist 기능을 제공합니다.

### 주요 기능

* Client 인증
* Client 데이터 관리
* Wishlist 관리
* Cart 관리

---

## 2. 인증 (Auth)

### 2.1 인증

* **Supabase Google SDK**를 사용합니다.
* 인증 완료 후 Client를 식별할 수 있는 Client ID를 사용합니다.
* 구체적인 회원가입, 로그인 및 권한 정책은 추후 확정합니다.

---

## 3. Client 데이터 (Data Scope)

### 3.1 Client

* Client ID
* 인증 정보 참조
* Cart 데이터
* Wishlist 데이터

> 실제 인증 정보 및 사용자 인증 상태는 Supabase Auth에서 관리합니다.

---

## 4. Wishlist

### 4.1 Wishlist 관리

* Client가 상품을 Wishlist에 추가할 수 있어야 합니다.
* Client가 Wishlist에서 상품을 제거할 수 있어야 합니다.
* Client 자신의 Wishlist를 조회할 수 있어야 합니다.
* 동일한 상품을 중복 등록할 수 없어야 합니다.

### 4.2 데이터

* Client ID
* Product ID
* 등록 일시

---

## 5. Cart

### 5.1 Cart 관리

* Client가 상품을 Cart에 추가할 수 있어야 합니다.
* Cart 상품의 수량을 변경할 수 있어야 합니다.
* Cart 상품을 삭제할 수 있어야 합니다.
* Client 자신의 Cart를 조회할 수 있어야 합니다.

### 5.2 데이터

* Client ID
* Product ID
* Item ID
* SKU ID
* 수량

> 상품명, 가격, 재고 등의 정보는 조회 시 Product / Inventory 모듈의 현재 데이터를 사용합니다.

---

## 6. 데이터 접근 (Data Access)

* Client 데이터는 Supabase를 통해 관리합니다.
* Client 데이터의 조회 및 변경은 **Supabase RPC**를 사용할 수 있습니다.
* 인증된 Client는 자신의 데이터만 조회 및 변경할 수 있어야 합니다.
* 다른 Client의 Cart 및 Wishlist 데이터에는 접근할 수 없어야 합니다.

---

## 7. 권한 (Permissions)

### Client

* 자신의 Client 데이터 조회
* 자신의 Cart 조회 및 수정
* 자신의 Wishlist 조회 및 수정

### Admin

* Client 인증 및 개인 데이터에 직접 접근하지 않습니다.
* 필요한 관리 기능이 추가되는 경우 별도 권한을 정의합니다.

---

## 8. 비기능 요구사항 (Non-Functional Requirements)

### 8.1 데이터 무결성

* 존재하지 않는 Product를 Wishlist에 등록할 수 없어야 합니다.
* 동일한 Client의 동일한 Product를 Wishlist에 중복 등록할 수 없어야 합니다.
* Cart의 수량은 1 이상이어야 합니다.

### 8.2 데이터 격리

* Client는 자신의 데이터만 접근할 수 있어야 합니다.
* Supabase RLS 및 RPC를 통해 Client 데이터 접근을 제한합니다.
