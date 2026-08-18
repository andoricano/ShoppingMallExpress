# [PRD] 회원 인증, 프로필 및 권한 관리 모듈

## 1. 개요 (Overview)
본 문서는 쇼핑몰 SaaS의 회원 가입, 로그인, 최소 프로필 입력 및 **역할 기반 접근 제어(RBAC, Client/Admin 분리)**에 대한 PRD입니다. 
소셜 로그인(OAuth 2.0) 기반 통합으로 진입 장벽을 낮추는 동시에, **고객(Client)**과 **관리자(Admin)** 권한에 따른 기능 및 DB 접근 권한을 명확히 정의합니다.

---

## 2. 사용자 정보 수집 및 권한 범위 (Data Scope & RBAC)

### 2.1 SNS 소셜 로그인 수집 정보 (기본 제공)
- **식별자**: Unique User ID (Supabase Auth UID)
- **기본 프로필**: 이메일, 이름

### 2.2 추가 입력 정보 (로그인 후 / 배송 정보)
- **수령인 이름**: 필수
- **연락처**: 필수 (휴대폰 번호)
- **기본 배송지**: 필수 (우편번호, 기본 주소, 상세 주소)

### 2.3 역할 정의 및 DB 접근 권한 (Role & Permissions)
| 구분 | 역할 (Role) | 주요 기능 및 접속 범위 | DB 접근 권한 상세 |
| :--- | :--- | :--- | :--- |
| **Client** | 일반 고객 (`CLIENT`) | 쇼핑몰 FB (`apps/dev-fb` 등) | - **Product DB**: 읽기 전용 (`Read`)<br>- **History DB**: 주문/이용에 따른 자동 이력 생성 (`Write`는 시스템 로직으로 처리, 직접 수정 불가) |
| **Admin** | 관리자 (`ADMIN`) | 관리자 어드민 (`apps/admin`) | - **Product DB**: 생성, 조회, 수정, 삭제 (`CRUD`)<br>- **Inventory DB**: 재고 관리 전권 (`CRUD`)<br>- **User/Order DB**: 전체 회원 및 주문 현황 관리 |

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.0 사용자 이용 흐름 (User Flow)

1. **[진입]** 유저가 회원가입/로그인 페이지 접근
2. **[인증]** 원하는 SNS 버튼(Google, Instagram, Naver, Kakao) 클릭 후 OAuth 인증 진행
3. **[분기 - 권한 및 프로필 확인]** 인증 완료 후 서비스 DB 조회
   - **Admin 권한 유저**: 관리자 대시보드로 이동
   - **Client 권한 유저**:
     - *Case A. 기존 회원 (추가 정보 입력 완료)* -> 메인/이전 페이지로 이동 (로그인 완료)
     - *Case B. 신규 회원 또는 추가 정보 미입력 회원* -> '추가 정보 입력(배송지 등)' 페이지로 리다이렉트
4. **[정보 입력]** (Client 전용) 수령인 이름, 연락처, 배송지 주소 입력 후 완료 클릭
5. **[완료 및 혜택]** 
   - `profiles` 테이블에 유저 정보 저장 (`is_onboarded = true`)
   - `USER_REGISTERED` 이벤트 발생 -> 신규 가입 혜택(쿠폰/포인트) 자동 지급
   - 쇼핑몰 메인 화면으로 리다이렉트

### 3.1 Front-End (FE)
- **Client FB (`apps/dev-fb`)**:
  - SNS 로그인 UI (Google, Instagram, Naver, Kakao)
  - 추가 정보 입력 UI (온보딩 페이지 - 주소 검색 API 연동)
  - Product DB 조회 및 결제/주문 내역(History) 확인 기능
- **Client Admin (`apps/admin`)**:
  - 관리자 전용 로그인 / RBAC 인가 기반 접근 제어
  - Product DB 및 Inventory DB 관리를 위한 CRUD 대시보드 UI

### 3.2 Back-End (BE) & 인프라 (Supabase + Google Cloud)
- **인증 및 세션 관리**:
  - Supabase Auth를 통한 OAuth 2.0 및 JWT(Access/Refresh Token) 세션 관리
  - JWT 내 `role` 정보를 포함하여 API 인가(Authorization) 처리
- **데이터베이스 보안 (Supabase RLS 적용)**:
  - `profiles.role` 값에 따른 Row Level Security 정책 적용
  - `CLIENT`: Product 테이블 `SELECT` 전용 RLS 부여
  - `ADMIN`: Product 및 Inventory 테이블 `ALL(SELECT, INSERT, UPDATE, DELETE)` RLS 부여

### 3.3 후속 처리 로직
- **가입 완료 이벤트 발행**:
  - Client가 추가 정보 입력을 완료하면 `USER_REGISTERED` 이벤트 발생 -> 혜택 모듈 연동

### 3.4 약관 동의 및 개인정보 보호 (Compliance)
- 소셜 로그인 성공 후 온보딩 화면에서 [필수] 약관 및 [선택] 마케팅 동의 수집

### 3.5 로그아웃 및 회원 탈퇴 (Account Lifecycle)
- **로그아웃**: Supabase Auth `signOut()` 호출 및 세션 클리어
- **회원 탈퇴**: 유저 프로필 익명화 처리 (주문/결제 데이터 법정 5년 보관)

### 3.6 예외 처리 및 접근 제어 정책 (Edge Cases)
- **Role Guard (권한 제어)**:
  - `CLIENT` 권한 유저가 관리자 페이지(`apps/admin`) 또는 관리자 API 접근 시 `403 Forbidden` 처리 및 메인으로 리다이렉트
- **온보딩 이탈자 Route Guard**:
  - 필수 배송지 정보가 없는 `CLIENT` 유저는 회원 전용 페이지 접근 제한
- **OAuth 취소/실패**: 로그인 실패 안내 레이어 출력 후 로그인 페이지 유지

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

- **보안 & RBAC**:
  - Supabase RLS 및 API Gateway 수준에서 Client/Admin 접근 권한 철저 분리
- **사용성 (UX)**:
  - 고객 온보딩 동선 3단계 이내 유지, 관리자는 권한에 맞는 전용 대시보드 즉시 연결
