# [PRD-PROD-04] 상품 알림 및 대시보드 위젯 (Product Alerts & Dashboard)

## 1. 화면 및 위젯 개요 (Screen & Widget Overview)

- **화면 경로**: 
  - 대시보드 위젯: `/admin/dashboard`
  - 알림 센터 이력: `/admin/products/alerts`
- **화면/위젯 목적**: 품절, 재고 임박, 판매 급증 등 상품 관련 주요 이벤트를 실시간 및 주기적으로 모니터링하고, 판매자에게 빠른 알림을 제공하여 즉각적인 재고 수급 및 수동 조치를 유도.
- **주요 사용자**: 어드민 관리자, 상품 운영 담당자, 재고 관리 담당자

---

## 2. 기능 요구사항 (Functional Requirements)

### 2.1 대시보드 위젯 (Dashboard Widgets)

#### A. 재고 임박 / 품절 위젯 (Low & Out of Stock Widget)
- **노출 대상**: 원천 재고가 0이거나 지정된 안전 재고(Safety Stock) 이하로 떨어진 상품/SKU 목록.
- **표시 정보**: 대표 이미지, 상품명, 옵션명, 현재 원천 재고 수량, 상태 태그 (`[품절]`, `[재고 임박]`).
- **인터랙션**: 
  - 해당 항목 클릭 시 해당 상품 수정 페이지(`/admin/products/:id/edit`)로 즉시 이동.
  - [전체 보기] 클릭 시 상품 목록 페이지(`/admin/products?status=SOLD_OUT`)로 이동.

#### B. 판매 급증 상품 위젯 (Surge Sales Widget)
- **노출 대상**: 기준 시간(예: 최근 1시간) 동안 설정된 판매 수량 이상 발생한 상품 목록.
- **표시 정보**: 상품명, 단위 시간 내 판매량, 현재 남아있는 원천 재고 수량.
- **인터랙션**: 항목 클릭 시 상품 수정 또는 해당 상품 주문 목록 페이지로 이동.

---

### 2.2 알림 센터 (Alert Center)

#### A. GNB 헤더 알림 드롭다운 (Global Navigation Bar)
- **GNB 종(Bell) 아이콘**: 
  - 읽지 않은 알림이 있을 경우 Red Dot 뱃지 표시.
  - 아이콘 클릭 시 최근 미확인 알림 팝오버(Popover) 레이어 출력 (최대 5개).
- **드롭다운 내 액션**:
  - 알림 항목 클릭 시: 해당 알림 `isRead = true` 처리 후 대상 상품 수정 페이지로 이동.
  - **[모두 읽음]** 버튼: 미확인 알림 전체를 읽음 처리.
  - **[전체 알림 보기]**: 알림 이력 페이지(`/admin/products/alerts`)로 이동.

#### B. 알림 이력 관리 페이지 (`/admin/products/alerts`)
- **필터링**:
  - **알림 유형**: `전체`, `OUT_OF_STOCK` (품절), `LOW_STOCK` (재고 임박), `SURGE_SALES` (판매 급증)
  - **읽음 상태**: `전체`, `UNREAD` (미확인), `READ` (확인 완료)
- **알림 목록 데이터 테이블**:
  - 컬럼: 알림 유형 뱃지, 대상 상품명/SKU, 알림 메시지, 발생 일시, 읽음 여부, 액션 버튼 (`[이동]`).
- **일괄 읽음 처리**: 체크박스 선택 후 [선택 항목 읽음 처리] 기능 제공.

---

## 3. 알림 발생 조건 및 정책 (Alert Rules & Triggers)

| 알림 유형 (`AlertType`) | 트리거 조건 (Trigger Rules) | 알림 메시지 템플릿 |
| :--- | :--- | :--- |
| **`OUT_OF_STOCK`** | 특정 상품의 모든 SKU 또는 특정 옵션의 원천 재고가 `0`이 된 경우 | `[품절] '{product_name}' ({option_name}) 상품이 품절되었습니다.` |
| **`LOW_STOCK`** | 원천 재고가 설정된 안전재고(기본값: 5개) 이하로 하락한 경우 | `[재고 임박] '{product_name}' 재고가 {current_stock}개 남았습니다.` |
| **`SURGE_SALES`** | 최근 1시간 동안 특정 상품의 주문량이 설정값(예: 50건) 이상 달성 시 | `[판매 급증] '{product_name}' 상품이 최근 1시간 동안 {sales_count}건 판매되었습니다.` |

- **중복 발생 방지 정책**: 동일 상품/SKU에 대해 '미확인(`UNREAD`)' 상태의 동일 알림이 이미 존재하는 경우, 수량이 변경되더라도 중복 알림을 생성하지 않고 기존 알림의 내용/수량만 업데이트.

---

## 4. API 연동 매핑 (API Interface Mapping)

| UI 이벤트 / 액션 | HTTP Method & Endpoint | Request Payload / Params | 비고 |
| :--- | :--- | :--- | :--- |
| **대시보드 위젯 로딩** | `GET /api/admin/products/alerts/summary` | `query: { limit }` | 대시보드 요약 데이터 |
| **알림 이력 목록 조회** | `GET /api/admin/products/alerts` | `query: { type, isRead, page, limit }` | 알림 센터 페이지 |
| **단일 알림 읽음 처리** | `PATCH /api/admin/products/alerts/:id/read` | `params: { id }` | 알림 클릭 시 동시 실행 |
| **알림 일괄/전체 읽음** | `PATCH /api/admin/products/alerts/read-all` | `body: { alertIds?: string[] }` | alertIds 없으면 전체 읽음 |

---

## 5. 예외 처리 및 UI 피드백 (Exception Handling)

1. **삭제된 상품의 알림 클릭 시**:
   - 알림 항목 클릭 시 해당 상품이 `DELETED` 상태인 경우, 페이지 이동 대신 경고 토스트 출력 ("삭제된 상품입니다.") 후 알림 상태만 읽음(`READ`)으로 변경.
2. **실시간 알림 갱신 (Polling / SSE)**:
   - 어드민 화면 상단 GNB 알림은 주기적 Polling (예: 60초 간격) 또는 SSE를 통해 백그라운드에서 신규 알림 여부를 조회하여 Red Dot 뱃지 동적 업데이트.
3. **위젯 내 데이터 부재 시**:
   - 품절/재고 임박 상품이 없을 경우 위젯 영역에 *"현재 품절 또는 재고 임박 상품이 없습니다."* 안내 문구 노출.