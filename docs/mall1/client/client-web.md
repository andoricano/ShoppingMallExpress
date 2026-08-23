# [PRD] 소규모 D2C 자사몰 웹사이트 (MVP)

## 1. 프로젝트 개요
* **목적**: 단일 브랜드/소수 자사 아이템을 효과적으로 홍보하고 판매하기 위한 D2C 쇼핑몰 구축
* **타깃 디바이스**: Web (Desktop, Laptop 최적화, Max-width 1280px~1440px 중앙 정렬)
* **기술 스택**: Next.js (App Router), TypeScript, React, Tailwind CSS (v4)
* **운영 환경**: Turborepo Monorepo 구조 (`apps/client-web`)

---

## 2. 프로젝트 설정 관리 (Site Config Specification)
사이트 정적 정보 및 공통 UI 데이터는 코드 내 하드코딩을 지양하고 `config/site.ts` (또는 `site.config.ts`) 객체에서 모듈화하여 관리한다.

* **사이트 기본 정보**: 사이트명, 설명, 대표 URL, 파비콘 설정
* **네비게이션(GNB/LNB) 메뉴**: 메뉴명, 이동 Path, 활성화 여부
* **사업자 정보 (Footer 노출용)**:
  * 상호명, 대표자명, 사업자등록번호, 통신판매업신고번호
  * 사업장 소재지, CS 대표번호/이메일, 운영 시간
* **SNS & 외부 링크**: 인스타그램, 유튜브, 네이버스토어 등 링크

---

## 3. 사용자 역할 & 권한 (User Roles)
1. **비회원/방문자**: 상품 조회, 장바구니 담기, 비회원 주문/결제, 비회원 주문 조회
2. **회원**: 로그인/회원가입, 마이페이지(주문 내역, 배송 추적, 프로필 관리)
3. **관리자 (Admin)**: 상품 등록/수정/삭제, 주문 관리, 배송 상태 업데이트

---

## 4. 핵심 메뉴 및 라우팅 구조 (Information Architecture)
App Router 경로 기반 프론트엔드 라우팅 설계:

* **메인 (Home)**: `/`
* **상품 목록 (Products)**: `/products`
* **상품 상세 (Product Detail)**: `/products/[id]`
* **장바구니 (Cart)**: `/cart`
* **주문/결제 (Checkout)**: `/checkout`
* **주문 완료 (Order Complete)**: `/order/success`
* **마이페이지 (My Page)**: `/mypage`
* **로그인/회원가입**: `/login`, `/signup`

---

## 5. 페이지별 상세 요구사항 (Functional Requirements)

### 5.1. Header & Navigation Bar
* **브랜드 로고**: Config의 사이트명/로고 연동, 클릭 시 메인 페이지(`/`) 이동
* **GNB**: Config의 `mainNav` 배열을 순회하여 바인딩 (`Products`, `About`, `Notice` 등)
* **우측 유틸리티**: 검색, 마이페이지 아이콘, 장바구니 아이콘 (Zustand/Context 기반 수량 배지 표시)

### 5.2. Footer (푸터)
* **사업자 정보 영역**: Config의 `company` 객체 데이터 자동 출력
* **이용약관 및 정책**: 개인정보처리방침, 이용약관 모달 또는 링크 연결
* **Copyright**: Config 기반 연도 및 상호명 자동 표기

### 5.3. 메인 페이지 (`/`)
* **Hero Banner**: 브랜드 가치 전달 비주얼 영역 및 C2A 버튼 ("지금 구매하기")
* **Featured Items**: 대표/신상품 카드 리스트 (이미지, 상품명, 가격, Quick Add 버튼)
* **Brand Story**: 미니멀 스타일의 브랜드 가치관 전달 영역

### 5.4. 상품 상세 페이지 (`/products/[id]`)
* **상품 이미지 갤러리**: 메인 대표 이미지 및 서브 썸네일
* **상품 정보 & 옵션**: 상품명, 가격, 옵션 선택(컬러/사이즈 등), 수량 제어
* **구매 유도 버튼**: [장바구니 담기], [바로 구매하기]
* **상세 정보 탭**: 상세 이미지/스펙, 배송/교환/반품 안내, 고객 후기

### 5.5. 장바구니 (`/cart`)
* **상품 리스트**: 체크박스 선택, 수량 변경, 삭제, 옵션 확인
* **주문 금액 계산**: 총 상품 금액 + 배송비 = 총 결제 예정 금액
* **주문 이동**: 선택된 상품 객체 데이터를 가지고 `/checkout` 이동

### 5.6. 주문/결제 페이지 (`/checkout`)
* **주문자/배송지 입력**: 이름, 연락처, 주소(우편번호 검색 연동), 배송 메모
* **결제 수단 연동**: PG사 연동 (신용카드, 간편결제 등)
* **최종 결제**: 약관 동의 후 결제창 호출 및 검증

### 5.7. 마이페이지 (`/mypage`)
* **주문 내역 조회**: 주문일자, 주문번호, 상품 정보, 결제 금액, 배송 상태
* **배송 추적**: 운송장 번호 연동 팝업/링크

---

## 6. 비기능적 요구사항 (Non-Functional Requirements)

* **성능 & SEO**: Next.js App Router의 Server Component 및 ISR/SSG 활용, OpenGraph 메타데이터 Config 동적 연동
* **UI/UX 디자인**: 데스크톱/랩톱 환경에 최적화된 미니멀 레이아웃, 공통 Layout(`Header`, `Footer`) 재사용
* **유지보수성**: Config 파일 수정을 통해 재빌드 시 푸터 사업자 정보 및 주요 메뉴 일괄 반영 가능 구조 수립

---

## 7. 개발 단계별 로드맵 (Milestones)

* **Phase 1 (MVP - Layout & Core)**:
  * `site.config.ts` 설계 및 공통 Header/Footer Layout 구성
  * 상품 목록/상세, 장바구니 상태 관리(Zustand), 비회원 결제(PG 연동)
* **Phase 2**: 회원가입/로그인(Supabase Auth), 마이페이지 주문 내역 조회
* **Phase 3**: 어드민 페이지 및 백엔드 CRUD 연동