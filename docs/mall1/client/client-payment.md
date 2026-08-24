# [개발 계획] Payment 모듈 구축 및 Order 연동 수립안

---

## 1. 개요 및 핵심 원칙
본 계획서는 이미 API 및 UI 테스트가 완료된 **Order 모듈**을 바탕으로, **Payment 모듈**을 안전하고 견고하게 구축하기 위한 4단계 개발 실행 계획입니다.

### 핵심 설계 원칙
1. **DB (Order) 기반 Strict 금액 검증**: 클라이언트 전달 금액 불인정, `Orders.total_amount`를 **Source of Truth**로 참조.
2. **동시성 및 멱등성 보장**: 승인 API(Redirect)와 웹훅(WebNoti)의 Race Condition 방지 (분산락 적용) 및 중복 처리 차단.
3. **분리된 트랜잭션 관리**: PG 실패/취소 시 Order 재고 선점 점유 해제(TTL) 연동.


## 2. 단계별 개발 상세 계획

### [1단계: 설계] -> [2단계: Mock & 검증] -> [3단계: 동시성/멱등성 Engine] -> [4단계: E2E 통합 & 환불]

### 1단계: API 인터페이스 & DB 스키마 상세 설계 (Contract First)
> **목표**: PRD의 가변적인 PG 파라미터(`authKey`, `tid` 등)를 수용할 수 있는 명확한 스키마 및 연동 API 규격 정의

1. **Payment DB 스키마 설계**
   - `payments`: `payment_id`, `order_id` (FK), `tid`, `amount`, `vbank_amount`, `refunded_amount`, `status`, `receipt_url`
   - `refunds`: `refund_id`, `payment_id` (FK), `cancel_tid`, `requested_cancel_amount`, `remain_amount`, `reason`

2. **엔드포인트 연동 규격 확정**
   - `POST /api/v1/payments/prepare` : 결제 사전 등록 (`PAYMENT_PENDING` 상태 생성)
   - `POST /api/v1/payments/approve` : Client SDK 인증 후 Server-to-Server 최종 승인
   - `POST /api/v1/payments/webhook` : PG 웹훅(가상계좌 입금 통보 등) 수신
   - `POST /api/v1/payments/{payment_id}/cancel` : 전액/부분 환불 요청

3. **Order ↔ Payment 연동 인터페이스 정의**
   - Order의 `total_amount` 조회 내부 서비스 모듈 연결
   - 결제 성공 시 Order 상태 변경 (`[결제대기] -> [주문접수]`) 이벤출/콜백 구조 정의

---

### 2단계: PG 연동 Mocking & 핵심 비즈니스 로직 단위 개발
> **목표**: 외부 PG 의존성을 격리하여 strict 금액 검증 및 위변조 방지 로직 우선 구현

1. **Mock PG Adapter 구축**
   - 나이스페이먼츠 테스트 키 바인딩 및 PG 연동 인터페이스 추상화
   - 네트워크 타임아웃, 승인 실패, 금액 불일치 상황을 시뮬레이션할 Mock Adapter 개발

2. **금액 및 Signature 검증 로직 구현**
   - DB `Orders.total_amount`와 PG 인증 response (`Amt`) 비교 검증
   - 나이스페이먼츠 보안 규격에 맞춘 `Signature` Hashing 및 유효성 검증 알고리즘 탑재

---

### 3단계: 동시성 제어 & 멱등성(Idempotency) 엔진 구축
> **목표**: 클라이언트 리다이렉트 승인 요청과 PG Webhook 통보가 동시에 들어오는 Race Condition 완벽 차단

1. **분산락 (Distributed Lock) 구현**
   - `order_id` 또는 `tid` 기반 Redis Lock (또나 DB Pessimistic Lock) 적용
   - 승인 API와 Webhook 진입 시 락 선점 로직 구현

2. **상태 기반 멱등성 (Safe Return) 처리**
   - 이미 `PAID` 또는 `VBANK_READY`인 상태 수신 시, 추가 PG 요청/DB 업데이트 없이 즉시 `HTTP 200 OK` 반환

3. **가상계좌 (VBANK) 입금 흐름 구성**
   - `VBANK_READY` 발급 상태 처리
   - 입금 통보 Webhook 수신 시 락 획득 후 `PAID` 전환 및 Order 상태 업데이트 연동

---

### 4단계: E2E 통합 테스트 & 예외/환불/정산 처리
> **목표**: Order - Payment - PG 간의 전체 결제 라이프사이클 검증

1. **E2E 결제 정상 흐름 검증**
   - `장바구니/바로구매` -> `Order 생성 & 재고 선점(Hold)` -> `Payment 사전 등록` -> `PG SDK 결제` -> `Server-to-Server 승인` -> `[주문접수] 전환 & 재고 확정`

2. **예외 및 롤백 (Rollback) 시나리오 검증**
   - 결제 실패/이탈 시 Order의 임시 재고 선점 자동 해제 (TTL 만료 처리)
   - 승인 실패 시 `PAYMENT_FAILED` 상태 업데이트 및 실패 응답 반환

3. **환불 및 영수증 연동**
   - 전액 취소 및 부분 취소 시 `refunded_amount` 및 `remain_amount` 산출 로직 검증
   - 매출전표 URL (`receiptUrl`) DB 저장 및 조회 API 제공

---

## 3. 마일스톤 및 주요 Output Summary

| 단계 | 주요 작업 내용 | Output |
| :--- | :--- | :--- |
| **1. 설계** | DB 스키마, API 엔드포인트 명세, Order 연동 규격 수립 | API 명세서, ERD |
| **2. Mock & 검증** | Mock PG 구축, Strict 금액 위변조 및 Signature 검증 | 검증 로직 단위 테스트 코드 |
| **3. 동시성 Engine** | Redis/DB Lock, 멱등성 보장, Webhook 안전 처리 | Race Condition 방지 엔진 |
| **4. E2E & 예외** | Order-Payment E2E 통합 테스트, 부분취소/재고 원복 | 전체 결제 흐름 검증 완료 |