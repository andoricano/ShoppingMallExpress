# [PRD] 구매 모듈 (Purchase)

> 본 모듈은 **Client의 상품 구매 과정을 처리하고, 결제 완료 후 Order를 생성하는 모듈**입니다.
>
> NICEPAY 테스트 결제를 사용하며, 결제 결과는 Order 모듈과 연동합니다.

---

## 1. 개요 (Overview)

Client가 상품 구매를 요청하면 NICEPAY 결제를 진행하고,
결제 성공 시 Order를 생성합니다.

### 구매 Flow

```text
Product
  ↓
Purchase 요청
  ↓
NICEPAY 결제
  ↓
결제 승인 확인
  ↓
Order 생성
  ↓
구매 완료
```

---

## 2. 관리 데이터 (Data Scope)

### 2.1 Purchase

* Purchase ID
* Client ID
* 결제 금액
* 결제 상태
* NICEPAY 거래 ID
* 생성 일시

### 2.2 결제 상태

```text
READY
PAID
FAILED
```

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 구매 요청

* Client가 구매할 상품과 수량을 전송합니다.
* 서버에서 구매 금액을 확인합니다.
* Purchase를 생성하고 상태를 `READY`로 설정합니다.

### 3.2 결제 처리

* NICEPAY 테스트 결제를 진행합니다.
* 결제 승인 결과를 서버에서 확인합니다.
* 승인된 금액과 구매 금액이 일치하는지 검증합니다.

### 3.3 구매 완료

* 결제 승인 성공 시 Purchase를 `PAID`로 변경합니다.
* 결제 성공 후 Order를 생성합니다.
* 동일한 결제로 Order가 중복 생성되지 않아야 합니다.

### 3.4 구매 실패

* 결제 승인 실패 시 Purchase를 `FAILED`로 처리합니다.
* 실패한 결제는 Order를 생성하지 않습니다.

---

## 4. 권한 (Permissions)

* **Client**: 자신의 구매 요청 및 결과 확인
* **Admin**: 구매 내역 조회
* **기타 사용자**: 접근 불가

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

### 5.1 결제 검증

* Client가 전달한 결제 금액을 그대로 신뢰하지 않습니다.
* 서버에서 최종 구매 금액을 검증합니다.
* NICEPAY 민감 인증 정보는 Client에 노출하지 않습니다.

### 5.2 중복 방지

* 동일한 NICEPAY 거래에 대해 중복 Purchase 또는 Order가 생성되지 않아야 합니다.
* 이미 완료된 Purchase를 다시 구매 완료 처리하지 않습니다.
