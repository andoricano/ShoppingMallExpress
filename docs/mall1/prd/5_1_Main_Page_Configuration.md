
# [PRD] 메인 페이지 구성 모듈 (Main Page Configuration) - Admin Only

> 본 모듈은 **어드민(Admin Web)에서 Client 메인 페이지의 구성과 노출 상태를 관리**하기 위한 모듈입니다.
>
> Client는 본 모듈에 직접 접근하지 않으며, 저장된 Config를 기반으로 메인 페이지를 렌더링합니다.

---

## 1. 개요

어드민에서 메인 페이지의 Header, Hero, Section, Footer 구성을 설정합니다.

메인 페이지는 `ClientPageConfig`를 기준으로 구성되며, 각 Section의 순서와 활성 상태를 관리할 수 있습니다.

---

## 2. 관리 데이터

### 2.1 Header

* Header 활성 상태
* Header 메뉴 구성
* 메뉴 순서

### 2.2 Hero

* Hero 이미지
* 제목
* 설명
* 이동 경로
* 노출 순서
* 활성 상태

### 2.3 Main Section

Main Section은 다음 유형을 지원합니다.

* `PRODUCT`
* `CATEGORY`
* `BANNER`

각 Section은 다음 정보를 관리합니다.

* Section ID
* Section 유형
* 노출 순서
* 활성 상태

### 2.4 Footer

* Footer 활성 상태
* 사업자 정보
* 대표자 정보
* 사업자등록번호
* 주소
* 고객센터
* 추가 정보

---

## 3. 기능 요구사항

### 3.1 메인 페이지 구성 조회

* 현재 저장된 Main Page Config 조회
* Header / Hero / Section / Footer 구성 확인
* 활성/비활성 상태 확인

### 3.2 Section 관리

* 새로운 Section 추가
* Section 수정
* Section 삭제
* Section 활성화 / 비활성화
* Section 순서 변경

### 3.3 Product Section 설정

* Product Post 선택
* Product Post 노출 순서 설정
* Layout 설정
* Section 제목 설정

### 3.4 Category Section 설정

* Category 선택
* Category 노출 순서 설정

### 3.5 Banner Section 설정

* Banner 이미지 설정
* 제목 설정
* 설명 설정
* 이동 경로 설정

### 3.6 Header / Hero / Footer 설정

* 각 영역의 활성/비활성 설정
* Header 메뉴 구성
* Hero 구성
* Footer 정보 수정

### 3.7 Config 저장

* 수정된 Main Page Config 저장
* 저장된 Config는 Client Main Page에서 사용
* Config 저장 시 Section 순서와 활성 상태 유지

---

## 4. 권한

* **Super Admin**: 메인 페이지 구성 전체 관리
* **Store Operator**: 허용된 메인 페이지 구성 관리
* **Customer**: 접근 불가

---

## 5. 비기능 요구사항

### 5.1 접근 제어

* 메인 페이지 구성 API는 Admin 권한 사용자만 접근 가능
* Client에서는 Config 직접 수정 불가

### 5.2 데이터 일관성

* Section 순서는 중복되지 않아야 함
* 삭제된 Section은 Client에 노출되지 않아야 함
* 비활성 Section은 Client에 노출되지 않아야 함
* 저장된 Config와 Client의 실제 메인 페이지 구성이 일치해야 함