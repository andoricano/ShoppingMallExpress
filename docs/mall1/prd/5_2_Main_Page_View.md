# [PRD] 메인 페이지 보기 모듈 (Main Page View) - Client

> 본 모듈은 **Client에서 저장된 Main Page Config를 기반으로 메인 페이지를 렌더링**하기 위한 모듈입니다.
>
> Client는 Main Page Config를 직접 수정하지 않으며, Admin에서 저장된 구성 데이터를 조회하여 화면에 표시합니다.

---

## 1. 개요

Client 메인 페이지는 `ClientPageConfig`를 기반으로 구성됩니다.

Config에 정의된 Header, Hero, Section, Footer의 활성 상태와 순서를 기준으로 실제 메인 페이지를 렌더링합니다.

---

## 2. 표시 데이터

### 2.1 Header

* Header 활성 상태 확인
* 설정된 메뉴 표시
* 메뉴 순서 반영

### 2.2 Hero

* 활성화된 Hero 표시
* 이미지 표시
* 제목 표시
* 설명 표시
* 이동 경로 지원
* 설정된 순서에 따라 표시

### 2.3 Main Section

Main Section은 다음 유형을 지원합니다.

* `PRODUCT`
* `CATEGORY`
* `BANNER`

각 Section은 Config의 순서에 따라 표시합니다.

### 2.4 Product Section

* 설정된 Product Post 조회
* Product Post 목록 표시
* 설정된 Layout 적용
* Section 제목 표시

지원 Layout:

* `GRID`
* `HORIZONTAL_SCROLL`
* `LARGE`

### 2.5 Category Section

* 설정된 Category 조회
* Category 목록 표시
* Config에 저장된 순서 반영

### 2.6 Banner Section

* Banner 이미지 표시
* 제목 표시
* 설명 표시
* 설정된 이동 경로 지원

### 2.7 Footer

* Footer 활성 상태 확인
* 사업자 정보 표시
* 대표자 정보 표시
* 사업자등록번호 표시
* 주소 표시
* 고객센터 및 추가 정보 표시

---

## 3. 기능 요구사항

### 3.1 Main Page Config 조회

* Client 메인 페이지 접근 시 Main Page Config 조회
* 저장된 Config를 기반으로 화면 구성

### 3.2 Section 렌더링

* 비활성화된 Section은 표시하지 않음
* `order` 기준으로 Section 정렬
* Section `type`에 따라 적절한 UI 컴포넌트 렌더링

### 3.3 콘텐츠 조회

* Product Section의 `postIds`를 기준으로 Product Post 조회
* Category Section의 `categoryIds`를 기준으로 Category 조회
* Config에 없는 콘텐츠는 메인 페이지에 표시하지 않음

### 3.4 예외 처리

* Config가 없거나 조회에 실패한 경우 기본 오류 화면 표시
* 참조한 Product Post 또는 Category가 존재하지 않는 경우 해당 콘텐츠만 제외
* 빈 Section은 빈 상태 UI 또는 해당 Section을 표시하지 않음

---

## 4. 데이터 원칙

* Client는 Main Page Config를 수정하지 않습니다.
* Client는 Admin에서 저장한 Config를 읽기 전용으로 사용합니다.
* Section의 표시 여부와 순서는 Config를 기준으로 합니다.
* 실제 Product, Category 등의 상세 데이터는 각 모듈의 API를 통해 조회합니다.
* Config의 참조 ID와 실제 콘텐츠가 일치하지 않는 경우 해당 콘텐츠를 표시하지 않습니다.

---

## 5. 비기능 요구사항

### 5.1 접근성

* 각 Section은 의미에 맞는 HTML 구조를 사용합니다.
* 이미지에는 필요한 경우 대체 텍스트를 제공합니다.
* 링크 및 버튼은 키보드로 접근할 수 있어야 합니다.

### 5.2 성능

* 메인 페이지 진입 시 필요한 Config와 콘텐츠만 조회합니다.
* 불필요한 전체 Product / Category 데이터를 조회하지 않습니다.
* Section별 콘텐츠 조회가 화면 성능에 과도한 영향을 주지 않도록 구성합니다.
