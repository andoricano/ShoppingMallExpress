# [PRD] Admin - 회원 관리 페이지 (User Management)

## 1. 개요 (Overview)
관리자가 전체 회원(CLIENT/ADMIN) 목록을 조회, 검색, 필터링하고 개별 회원의 상세 정보 및 이용 이력을 관리할 수 있는 어드민 전용 UI를 제공한다.

## 2. 화면 구조 (Layout)
- **2-Pane Layout (Split View)**
  - 메인 영역 (좌 70%): 회원 목록 테이블 (페이지네이션, 필터, 검색)
  - 상세 영역 (우 30% / Drawer): 선택된 회원의 프로필 및 이력 패널

## 3. 주요 기능 요구사항 (Functional Requirements)

### 3.1 회원 목록 테이블 & 필터링
- **검색:** 이름(`name`), 이메일(`email`), 연락처(`phone`) 키워드 검색 (Debounce 적용)
- **필터:**
  - 역할(Role) 필터: 전체 / `CLIENT` / `ADMIN`
  - 온보딩 필터: 전체 / 완료(`isOnboarded: true`) / 미완료(`isOnboarded: false`)
- **표시 컬럼:** 이름, 이메일, 역할(Role Badge), 온보딩 상태, 가입일, 상세 버튼

### 3.2 회원 상세 패널 (Discriminated Union 반영)
- **공통 프로필 영역 (`BaseProfile`):**
  - UID, 이메일, 이름, 역할, 가입일/수정일
- **역할별 프로필 분기:**
  - `CLIENT`: 수령인 이름, 연락처, 배송지 주소(`zonecode`, `address`, `detail`), 온보딩 완료 여부
  - `ADMIN`: 부서 정보(`department`)
- **이력 (History) 탭:**
  - [주문/결제 이력] 해당 유저의 주문 내역 리스트 (모듈 4, 5 연동)
  - [로그인/활동 로그] 최근 접속 및 이벤트 발생 이력

### 3.3 관리자 제어 액션 (Admin Actions)
- **역할(Role) 변경:** `CLIENT` ↔ `ADMIN` 변경 (변경 전 확인 모달)
- **계정 익명화/탈퇴 처리:** 법정 보관 기간(5년) 데이터 유지를 위한 개인정보 비식별화 처리

## 4. 예외 및 제어 정책 (Edge Cases)
- 로그인된 관리자 본인의 역할(`ADMIN` -> `CLIENT`)은 스스로 변경할 수 없음.
- `deletedAt`이 작성된 탈퇴 회원은 수정 불가 (읽기 전용 처리).