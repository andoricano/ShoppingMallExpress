# [PRD] 상품 게시물 카테고리 관리 모듈 (Category Client)

> 본 모듈은 **Client가 상품 게시물의 카테고리 정보를 조회하고 카테고리에 포함된 상품 게시물을 탐색하는 기능**을 정의합니다.
>
> Category의 생성, 수정, 삭제 및 관리는 Admin에서 담당합니다.

---

## 1. 개요

Client는 상품 게시물에 연결된 Category를 조회하고 Category를 기준으로 상품 게시물을 탐색할 수 있습니다.

---

## 2. Category 조회

* Category 목록 조회
* Category Tree 조회
* Category의 하위 Category 조회
* Category에 포함된 상품 게시물 조회
* 상품 게시물은 `ThumbnailInfo` 기반으로 조회

---

## 3. Category 구조

* Category는 계층형 Tree 구조로 관리
* 최대 3단계까지 지원
* 최상위 Category는 `parentId`가 없습니다.
* 각 Category는 여러 상품 게시물을 포함할 수 있습니다.
* 하나의 상품 게시물은 여러 Category에 포함될 수 있습니다.

---

## 4. Client 권한

* Client는 Category 조회만 가능합니다.
* Category 생성, 수정, 삭제는 제공하지 않습니다.
* Category의 생성 및 관리는 Admin에서 담당합니다.

---

## 5. Admin 연계

* Admin Category Tab에서 Category CRUD 제공
* Product Post 작성 및 수정 과정에서 Category를 지정할 수 있습니다.
* Category는 별도의 관리 화면과 Product Post 작성 화면에서 관리할 수 있습니다.
