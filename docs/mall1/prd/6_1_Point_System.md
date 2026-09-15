# [PRD] 포인트 시스템 모듈 (Point System)

> 본 모듈은 쇼핑몰에서 사용하는 **내부 포인트의 생성, 충전, 사용 및 적립 규칙**을 정의합니다.
>
> 현재는 간이 충전 방식을 사용하며, 향후 마일리지 또는 캐시 포인트로 확장할 수 있도록 구성합니다.

---

## 1. 개요

Client가 주문 결제에 사용할 수 있는 내부 포인트 시스템을 관리합니다.

포인트의 충전, 사용, 적립 및 차감 내역은 Transaction으로 관리합니다.

---

## 2. Point 데이터

### 2.1 Point Balance

* Client별 현재 보유 포인트
* 충전 및 사용에 따라 변경
* 주문 결제 진행 중에는 포인트를 별도로 예약하지 않음
* 실제 Point 차감은 최종 Order 생성 시점에 처리

### 2.2 Point Transaction

* 충전
* 사용
* 적립
* 환불 및 복구
* 관리자 조정
* 실제 포인트 변동이 발생한 경우에만 기록

---

## 3. Order 결제 수단

* Point를 주문의 결제 수단으로 사용할 수 있음
* 주문 금액의 일부 또는 전부를 Point로 결제할 수 있음
* Client는 주문 결제 시 사용할 Point 금액을 선택할 수 있음
* 외부 결제가 필요한 경우 주문 금액에서 Point 사용 금액을 제외한 금액으로 결제를 진행
* 외부 결제가 성공한 후 최종 Order 생성 시 Point 잔액을 다시 확인
* 사용 가능한 Point가 충분한 경우에만 Point 차감 및 Order 생성을 진행
* 확정된 Point 사용 내역은 `USE` Transaction으로 기록
* Point 잔액 부족 또는 주문 생성 실패 시 Point를 차감하지 않음
* 주문 취소 및 환불 시 정책에 따라 Point 복구

### Point 전액 결제

* Point 사용 금액이 최종 주문 금액과 동일한 경우 외부 결제를 진행하지 않을 수 있음
* 최종 Order 생성 시 Point 잔액을 확인한 후 전액 차감
* `USE` Transaction을 기록

---

## 4. Point 충전

* Client가 지정된 금액만큼 Point 충전
* 현재는 실제 결제 없이 간이 충전 방식 사용
* 충전 완료 시 Point Balance 증가
* 충전 내역 Transaction 기록

---

## 5. Point 적립

* 주문 완료 등 지정된 조건에 따라 Point 적립
* 적립된 Point는 Balance에 반영
* 적립 내역 Transaction 기록
* 적립 기준은 서비스 정책에 따라 변경 가능

---

## 6. 데이터 원칙

* Point Balance와 Transaction의 정합성 유지
* 모든 실제 Point 변동 내역 기록
* 임의의 Point 잔액 직접 수정 금지
* Point 변동은 DB 트랜잭션으로 처리
* 최종 Order 생성 시 Point 잔액을 서버에서 다시 검증
* Point 차감과 Order 생성은 동일한 DB 트랜잭션에서 처리
* 주문 생성 실패 시 Point가 차감되지 않도록 보장
