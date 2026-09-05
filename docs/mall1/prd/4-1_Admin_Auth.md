# [PRD] 관리자 인증 및 권한 관리 모듈

> 본 문서는 쇼핑몰 SaaS의 **Admin 인증, 관리자 권한 및 접근 제어**를 정의합니다.
>
> Client의 로그인, 프로필, 온보딩 및 개인 정보 관리는 `Client_Auth`에서 별도로 정의합니다.

---

## 1. 개요

관리자(Admin)는 인증된 계정을 통해 관리자 서비스에 접근합니다.

관리자 인증은 Supabase Auth를 기준으로 하며, 인증된 사용자의 `ADMIN` 권한을 확인하여 관리자 기능에 대한 접근을 제어합니다.

```text
Google OAuth
   ↓
Supabase Auth
   ↓
인증 User 확인
   ↓
ADMIN 권한 확인
   ↓
관리자 서비스 접근
```

---

## 2. 사용자 정보 및 역할

### 2.1 인증 정보

Supabase Auth를 통해 다음 기본 정보를 확인할 수 있습니다.

```text
User ID
Email
Name
```

`User ID`는 Supabase Auth의 UID를 사용합니다.

### 2.2 역할

관리자 서비스는 다음 Role을 사용합니다.

```text
ADMIN
```

관리자 기능은 `ADMIN` 권한을 가진 사용자만 사용할 수 있습니다.

Client 사용자의 인증 및 프로필 정보는 `Client_Auth`에서 관리합니다.

---

## 3. 관리자 로그인

관리자는 지원되는 OAuth Provider를 통해 로그인할 수 있습니다.

현재 프로젝트에서는 Google OAuth를 사용합니다.

```text
관리자 로그인
   ↓
Google OAuth
   ↓
Supabase Auth
   ↓
인증 완료
```

OAuth 인증에 실패하거나 취소된 경우 관리자 로그인 화면으로 돌아갑니다.

---

## 4. 관리자 권한 확인

인증이 완료된 User에 대해 관리자 권한을 확인합니다.

```text
인증 User
   ↓
Role 확인
   ├─ ADMIN
   │    ↓
   │  관리자 서비스 접근
   │
   └─ 그 외
        ↓
      접근 거부
```

관리자 권한은 서비스의 권한 정보에 따라 판단합니다.

Client 권한을 가진 사용자는 관리자 기능에 접근할 수 없습니다.

---

## 5. 관리자 접근 제어

Admin은 관리자 서비스 및 관리자 API에 접근할 수 있습니다.

관리자 서비스:

```text
Admin
├─ Product 관리
├─ Inventory 관리
├─ Category 관리
├─ Order 관리
└─ User 관리
```

관리자 권한이 없는 사용자가 관리자 페이지 또는 관리자 API에 접근하는 경우 접근을 거부합니다.

```text
권한 없음
   ↓
403 Forbidden
```

필요한 경우 관리자 로그인 또는 관리자 서비스의 기본 화면으로 이동합니다.

---

## 6. DB 접근 권한

Admin은 관리자 기능에 필요한 데이터에 대해 관리 권한을 가집니다.

### Product

```text
SELECT
INSERT
UPDATE
DELETE
```

### Inventory

```text
SELECT
INSERT
UPDATE
DELETE
```

### User / Order

관리자 화면에서 전체 회원 및 주문 현황을 조회하고 관리할 수 있습니다.

세부 CRUD 정책은 각 기능 모듈의 PRD에서 정의합니다.

---

## 7. Supabase Auth 및 Session

관리자 인증과 Session은 Supabase Auth를 사용합니다.

```text
Supabase Auth
├─ OAuth 2.0
├─ Access Token
└─ Refresh Token
```

인증 상태가 유지되는 동안 관리자 서비스의 인증 상태를 확인할 수 있어야 합니다.

로그인 상태가 만료되거나 로그아웃된 경우 관리자 인증이 필요한 화면에 접근할 수 없습니다.

---

## 8. Supabase RLS 및 API 권한

관리자 데이터는 Supabase RLS와 서버 API 권한 검증을 통해 보호합니다.

관리자 권한이 있는 경우 필요한 데이터에 대한 관리 작업을 수행할 수 있습니다.

관리자 권한이 없는 사용자는 관리자 데이터에 직접 접근할 수 없습니다.

클라이언트에서 전달한 Role 값만으로 관리자 권한을 신뢰하지 않으며, 서버 측에서도 권한을 검증합니다.

---

## 9. 로그아웃

관리자는 로그아웃할 수 있습니다.

로그아웃 시 Supabase Auth Session을 종료합니다.

```text
로그아웃
   ↓
Session 종료
   ↓
비인증 상태
```

---

## 10. 예외 처리

### 관리자 권한 없음

관리자 권한이 없는 사용자가 관리자 기능에 접근하는 경우:

```text
403 Forbidden
```

으로 처리합니다.

### 인증되지 않은 사용자

인증되지 않은 사용자가 관리자 인증이 필요한 페이지에 접근하는 경우 관리자 로그인 화면으로 이동합니다.

### OAuth 취소 / 실패

OAuth 인증이 취소되거나 실패한 경우 관리자 로그인 화면을 유지하고 실패 내용을 안내합니다.

---

## 11. 역할 범위

관리자 권한은 다음과 같이 구분합니다.

| Role     | 접근 범위             |
| :------- | :---------------- |
| `ADMIN`  | 관리자 서비스 및 관리자 API |
| `CLIENT` | 관리자 서비스 접근 불가     |

Client의 로그인, 프로필, 온보딩 및 개인 데이터 관리는 `Client_Auth`에서 별도로 정의합니다.
