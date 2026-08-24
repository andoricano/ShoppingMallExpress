# [PRD] 결제 모듈 (Payment)

## 1. 개요 (Overview)
본 문서는 쇼핑몰 SaaS의 결제 모듈에 대한 PRD입니다.
주문서 작성 완료 후 나이스페이먼츠(NICEPAY) 신모듈(Server-to-Server / Direct API 및 Client SDK)을 활용하여 안전한 결제 진행, DB 기반 strict 금액 위변조 검증, 동시성/멱등성이 보장된 승인 및 웹훅(WebNoti) 처리, 상태 세분화(가상계좌, 부분환불 등) 및 정산 처리를 수행합니다.

---

## 2. 관리 데이터 범위 (Data Scope)

### 2.1 결제 트랜잭션 데이터 (Payment Transaction)
- **결제 식별자**: `payment_id` (고유 결제 ID), `order_id` (주문 매핑 ID / Source of Truth), `user_id` (구매자 ID)
- **PG 연동 정보**: PG 거래 식별자 (`tid`), 결제 인증 토큰 (`authToken` / `authKey` 등 PG 응답 객체 원본은 기술설계 단계에서 매핑), 결제 수단 (`CARD`, `BANK`, `VBANK`, `EASYPAY` 등)
- **금액 및 상태**: 
  - 최종 결제 승인 금액 (`amount`), 가상계좌 입금 예정 금액 (`vbank_amount`), 누적 환불 금액 (`refunded_amount`)
  - **세분화된 결제 상태**: `PAYMENT_PENDING`(결제대기), `VBANK_READY`(가상계좌 발급/입금대기), `PAID`(결제완료), `PARTIAL_CANCELED`(부분취소완료), `CANCELED`(전액취소완료), `PAYMENT_FAILED`(결제실패)

### 2.2 환불 데이터 (Refund Data)
- **환불 식별자**: `refund_id`, `payment_id` (FK), PG 취소 거래번호 (`cancel_tid`)
- **환불 상세**: 환불 유형 (`FULL`, `PARTIAL`), 요청 환불 금액, 취소 후 잔액(`requested_cancel_amount`, `remain_amount`), 환불 사유, 환불 완료 일시

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 결제 데이터 사전 등록 및 금액 검증 준비 (Server-Driven)
- **Source of Truth (DB 우선 원칙)**:
  - 클라이언트가 전달하는 금액 데이터는 단순 참고용으로만 사용하며, **모든 검증 및 승인의 기준 금액은 DB 내 `Orders` 테이블의 실 결제 금액을 최우선(Source of Truth)**으로 참조.
- **결제 준비 트랜잭션 생성**:
  - '결제하기' 버튼 클릭 시, 서버 사이드에서 DB의 `order_id`와 `total_amount`를 기반으로 `PAYMENT_PENDING` 상태의 결제 트랜잭션을 사전 생성하여 금액 변조 가능성을 차단.

### 3.2 나이스페이먼츠 Client SDK 호출 및 인증 (Client UI)
- **최신 SDK 스펙 적용**:
  - 나이스페이먼츠 최신 Client SDK(`AUTHN.request` 또는 최신 JS SDK 메서드)를 이용해 카드, 계좌이체, 가상계좌 및 간편결제 창 호출.
- **인증 응답 수령 (Flexible Spec)**:
  - 카드사/앱카드 인증 완료 시 PG사로부터 반환되는 인증 결과 객체를 수령. (파라미터 명칭인 `authKey`, `tid`, `authToken` 등은 PRD에서 고정하지 않으며, 실제 나이스페이먼츠 API 버전별 기술설계 명세에서 확정 및 저장)
  - **주의**: 인증 완료 시점은 실제 차감이 발생한 상태가 아니며, 서버 승인 요청 단계로 진입하기 위한 임시 단계임.

### 3.3 Server-to-Server 결제 승인 및 Strict 금액 재검증
- **Strict 위변조 재검증**:
  - 클라이언트/ReturnURL로부터 전달받은 인증 결과의 `AuthToken`, `TID`, `Amt` 등을 수신한다.
  - DB `Orders.total_amount`를 Source of Truth로 사용한다.
  - DB 주문금액과 PG 인증금액이 일치하지 않을 경우 승인 처리를 중단한다.
  - NICEPAY 인증 응답의 `Signature`를 공식 검증 규칙에 따라 검증한다.

- **Server-to-Server 승인**:
  - 서버에서 NICEPAY 공식 승인 API/연동 규격에 따라 인증 결과를 전달하여 최종 승인을 요청한다.
  - `MerchantKey`는 서버에서만 사용한다.
  - 승인 요청 및 응답의 실제 Endpoint, Header, Request/Response 필드는 기술설계 단계에서 NICEPAY 공식 최신 개발문서 기준으로 확정한다.

- **승인 응답 검증**:
  - 승인 응답의 `ResultCode`, `TID`, `Amt`, `Signature` 등을 검증한다.
  - 승인 응답 Signature는 NICEPAY 공식 규칙에 따라 검증한다.

### 3.4 승인 API & 웹훅(WebNoti) 동시성 및 멱등성 처리 (System Engine)
- **동시성 제어 (Pessimistic/Redis Lock)**:
  - 클라이언트 리다이렉트에 의한 승인 API 호출과 PG사의 웹훅(WebNoti) 통보가 동시에 들어오는 Race Condition 발생 가능성 차단.
  - `order_id` 또는 `tid` 기반으로 DB 분산락(Distributed Lock) 또는 Row-level Lock을 획득하여 선행 작업이 먼저 처리되도록 보장.
- **상태 기반 멱등성(Idempotency) 보장**:
  - 이미 `PAID`, `VBANK_READY` 등 최종/중간 상태로 진입한 결제건에 대해 뒤늦게 들어오는 승인 요청이나 웹훅 통보는 **실제 승인 로직 및 DB 중복 업데이트를 수행하지 않고 즉시 성공(HTTP 200) 응답**.
- **가상계좌 입금 통보 (WebNoti)**:
  - 가상계좌 입금 통보 웹훅 수신 시, 멱등성을 검증하여 `VBANK_READY` 상태인 건에 한해서만 `PAID` 상태로 전환하고 주문 모듈을 `[주문접수]`로 연동.

### 3.5 결제 취소 및 부분환불 처리 (Admin & System)
- **환불 유형별 승인 연동**:
  - 전액 취소: 원거래 `tid` 및 `SecretKey`로 취소 API 호출 후 결제 상태를 `CANCELED`로 변경.
  - 부분 취소: 배송전 부분취소, 반품 시 차등 환불 지원. 요청 금액과 잔액(`remain_amount`) 계산 후 부분취소 API 호출.
- **부분환불 상태 관리 (`PARTIAL_CANCELED`)**:
  - 부분 취소 성공 시 `refunded_amount` 누적 업데이트.
  - 잔액이 남아있는 경우 결제 상태를 `PARTIAL_CANCELED`로 유지하며, 잔액이 0원이 되는 시점에 `CANCELED`로 최종 전환.
- **가상계좌 환불 지원**:
  - 가상계좌 결제건 취소 시 고객이 입력한 환불 계좌 정보(은행코드, 계좌번호, 예금주명)를 포함하여 나이스페이먼츠 환불 API 호출.

### 3.6 결제 및 환불 내역/영수증 조회 (Admin & Client)
- **영수증 및 전표 연동**: 승인 응답으로 전달받은 매출전표 URL(`receiptUrl`), 가상계좌 입금 확인서 URL, 현금영수증 발행 정보를 DB에 저장하여 조회 제공.
- **소비자/사업자 대시보드**: 마이페이지 주문 상세 내역 및 어드민 결제 관리 화면에서 PG 거래번호(`tid`) 기준 실시간 거래 상태, 부분취소 이력, 매출전표 팝업 출력 기능 제공.

---

## 4. 비기능 요구사항 (Non-Functional Requirements)

- **보안 및 위변조 방지 (Security)**:
  - 클라이언트 전달 값 불인정 (DB `Orders` 테이블 중심의 금액 검증 strict 적용).
  - PG 연동 `SecretKey` 및 API Key는 백엔드 환경변수(`.env`)로 관리하며 클라이언트에 절대 노출 금지.
  - Webhook 수신 시 나이스페이먼츠 제공 Signature/IP 검증 필수 수행.
- **동시성 및 멱등성 (Concurrency & Idempotency)**:
  - 승인 요청과 웹훅 간 Race Condition 방지를 위한 Lock 메커니즘 필수 구현.
  - 동일한 `tid` / `orderId` 수신 시 중복 처리 없이 Safe Return 처리.
- **가상계좌 입금 통보 신뢰성 (Webhook Reliability)**:
  - 웹훅 처리 실패 시 자동 재시도 대응 및 어드민 내 수동 입금 상태 보정 기능 제공.