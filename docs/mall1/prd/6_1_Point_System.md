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
* 결제 진행 중 사용 예정 포인트는 Reservation으로 별도 관리

### 2.2 Point Transaction

* 충전
* 사용
* 적립
* 환불 및 복구
* 관리자 조정
* 실제 포인트 변동이 발생한 경우에만 기록

### 2.3 Point Reservation

* 외부 결제 진행 중 사용할 Point를 임시 확보
* 예약된 Point는 다른 주문에서 사용할 수 없음
* 외부 결제 성공 시 사용 확정
* 결제 실패, 취소 또는 만료 시 예약 해제
* Reservation 자체는 Point Transaction으로 기록하지 않음

---

## 3. Order 결제 수단

* Point를 주문의 결제 수단으로 사용할 수 있음
* 주문 금액의 일부 또는 전부를 Point로 결제할 수 있음
* 결제에 사용할 Point는 외부 결제 진행 전에 Reservation 처리
* 외부 결제 성공 및 주문 생성 완료 후 Point 사용 확정
* 확정된 Point는 `USE` Transaction으로 기록
* 주문 취소 및 환불 시 정책에 따라 Point 복구

---

## 4. Point 충전

* Client가 지정된 금액만큼 Point 충전
* 현재는 실제 결제 없이 간이 충전 방식 사용
* 충전 완료 시 Point Balance 증가
* 충전 내역 Transaction 기록

---

## 5. Point 적립

* 주문 완료 등 지정된 조건에서 Point 적립
* 적립된 Point는 Balance에 반영
* 적립 내역 Transaction 기록
* 적립 기준은 서비스 정책에 따라 변경 가능

---

## 6. 데이터 원칙

* Point Balance와 Transaction의 정합성 유지
* 모든 실제 Point 변동 내역 기록
* 예약된 Point와 실제 사용 Point를 구분
* 임의의 Point 잔액 직접 수정 금지
* Point 변동 및 Reservation 처리는 DB 트랜잭션으로 처리
* 결제 실패 시 예약된 Point가 잔액으로 정상 복구되도록 보장
