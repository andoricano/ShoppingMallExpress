# [PRD] 포인트 관리 모듈 (Point Client)

> 본 모듈은 **Client가 보유한 Point를 조회하고 충전, 사용, 적립하는 기능**을 정의합니다.

---

## 1. 개요

Client는 보유 Point를 확인하고 주문 결제 및 충전에 사용할 수 있습니다.

---

## 2. Point 조회

* 현재 보유 Point 조회
* Point 충전 및 사용 내역 조회
* Point 적립 내역 조회

---

## 3. Point 사용

* 주문 결제 시 Point 사용
* 사용할 Point 입력 또는 선택
* 사용 가능 Point를 초과하여 사용 불가
* 사용된 Point는 Transaction으로 기록

---

## 4. Point 적립

* 주문 완료 등 지정된 조건에서 Point 적립
* 적립된 Point는 Balance에 반영
* 적립 내역 조회 가능

---

## 5. Point 충전

* 지정된 충전 금액 선택
* 현재는 간이 방식으로 Point 충전
* 충전 완료 후 Balance 반영
* 충전 내역 확인 가능

---

## 6. 주문 취소 및 환불

* Point로 결제한 주문 취소 시 사용 Point 복구
* 환불 처리 시 정책에 따라 사용 Point 복구
* 복구 내역은 Transaction으로 기록