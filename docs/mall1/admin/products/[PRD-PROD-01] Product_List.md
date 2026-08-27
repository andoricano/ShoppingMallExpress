# [PRD-PROD-01] 어드민 상품 목록 및 일괄 관리 (Product List & Batch Actions)

## 1. 화면 개요 (Screen Overview)

- **화면 경로**: `/admin/products`
- **화면 목적**: 등록된 전체 상품의 목록 조회, 카테고리/상태별 조건 검색, 진열 상태 일괄 변경, 카테고리 일괄 이동 및 Soft Delete 처리를 수행하는 통합 관리 화면.
- **주요 사용자**: 어드민 관리자, 상품 운영 담당자

---

## 2. 기능 요구사항 (Functional Requirements)

### 2.1 검색 및 필터링 (Search & Filters)

1. **카테고리 필터**:
   - 계층형 드롭다운 선택 (대분류 선택 시 중분류/소분류 옵션 동적 변경).
   - 선택된 최종 `categoryId`를 파라미터로 전송.
2. **진열 상태 필터**:
   - 옵션: `전체`, `DISPLAY` (진열중), `HIDDEN` (숨김), `SOLD_OUT` (품절).
   - 미선택 시 기본적으로 `DELETED` 상태를 제외한 전체 조회.
3. **검색어 입력 (Search Query)**:
   - 검색 대상: 상품명(`product_name`), 상품 ID(`product_id`).
   - **UUID 자동 감지**: 입력값이 UUID 패턴인 경우 `product_id` 일치 및 `product_name` 부분 검색을 동시에 적용(`or`), 일반 문자열인 경우 `product_name` 부분 검색(`ilike`)으로 동작.
4. **초기화 버튼**:
   - 모든 검색 필터 및 입력값을 기본값으로 초기화 후 1페이지로 재조회.

---

### 2.2 데이터 테이블 (Data Table)

| 컬럼명 | 표시 데이터 | UI/UX 상세 동작 |
| :--- | :--- | :--- |
| **선택 (Checkbox)** | 체크박스 | - 전체 선택 / 개별 선택 가능<br>- 체크 시 **Batch Action Bar** 활성화 |
| **대표 이미지** | `main_image_url` | - 50x50 썸네일 이미지<br>- 이미지 없을 경우 기본 Placeholder 노출 |
| **상품명 / ID** | `product_name`<br>`product_id` | - 상품명 클릭 시 해당 상품 수정 페이지(`/admin/products/:id/edit`)로 이동<br>- 상품 ID는 약식 표시(앞 8자리) + 클립보드 복사 버튼 제공 |
| **가격 정보** | `base_price`<br>`discounted_price` | - 정상가(취소선) / 할인가(강조) 동시 표기<br>- 할인 미적용 시 정상가만 표기 |
| **카테고리** | 계층 경로 | - 예: `의류 > 상의 > 반팔티` 형태로 텍스트 표기 |
| **진열 상태** | `status` | - Badge UI 적용<br>- `DISPLAY`: 초록색 (`진열중`)<br>- `HIDDEN`: 노란색 (`숨김`)<br>- `SOLD_OUT`: 빨간색 (`품절`) |
| **등록일시** | `created_at` | - `YYYY-MM-DD HH:mm` 포맷 |
| **관리 (Actions)** | 버튼 그룹 | - `[수정]`: 수정 페이지 이동<br>- `[삭제]`: Soft Delete 확인 모달 호출 |

---

### 2.3 일괄 관리 기능 (Batch Actions)

테이블 내 체크박스로 1개 이상의 상품이 선택되었을 때 상단에 **Batch Action Bar**가 노출됩니다.

#### A. 진열 상태 일괄 변경
1. **[진열 상태 일괄 변경]** 버튼 클릭 시 모달 팝업 호출.
2. Target Status 선택: `진열중 (DISPLAY)` 또는 `숨김 (HIDDEN)` 선택 가능. (DELETED, SOLD_OUT 변경은 제한)
3. **확인** 클릭 시 API 연동 후 결과 토스트 메시지 출력 ("N개 상품의 상태가 변경되었습니다.").

#### B. 카테고리 일괄 이동
1. **[카테고리 일괄 이동]** 버튼 클릭 시 모달 팝업 호출.
2. Target Category 선택 (대/중/소 선택 트리).
3. **확인** 클릭 시 기존 매핑 정보 백업 및 신규 매핑 일괄 생성.
4. 실패 시 자동 롤백 및 에러 토스트 출력.

---

### 2.4 상품 삭제 (Soft Delete)

1. 단일 삭제 버튼 또는 일괄 삭제 선택 시 **Confirm Alert Modal** 호출:
   - *"선택한 상품을 삭제하시겠습니까? 삭제 처리된 상품은 쇼핑몰 화면에서 즉시 노출 차단됩니다."*
2. **[삭제 확인]** 클릭 시 `status = 'DELETED'` 상태 업데이트 API 호출.
3. 삭제 성공 시 테이블 리로드 및 성공 피드백 전달.

---

## 3. API 연동 매핑 (API Interface Mapping)

| UI 이벤트 / 액션 | HTTP Method & Endpoint | Request Payload / Params | 비고 |
| :--- | :--- | :--- | :--- |
| **목록 로딩 / 검색** | `GET /api/admin/products` | `page`, `limit`, `status`, `categoryId`, `searchQuery` | 쿼리 스트링 전송 |
| **상태 일괄 변경** | `PATCH /api/admin/products/batch/status` | `{ productIds: string[], status: 'DISPLAY'\|'HIDDEN' }` | Batch Action |
| **카테고리 일괄 이동**| `PATCH /api/admin/products/batch/category` | `{ productIds: string[], targetCategoryIds: string[] }` | Batch Action |
| **단일 상품 삭제** | `DELETE /api/admin/products/:id` | `params: { id }` | Soft Delete |

---

## 4. 예외 처리 및 UI 피드백 (Exception Handling)

1. **검색 결과 없음**:
   - 테이블 영역에 *"조건에 맞는 상품이 존재하지 않습니다."* 안내문 및 [검색 초기화] 버튼 제공.
2. **유효하지 않은 UUID 입력 시**:
   - 클라이언트단 사전 검증으로 잘못된 파라미터 전송 방지 (서버 500 에러 차단).
3. **일괄 작업 중 partial fail 발생 시**:
   - 백엔드 예외 처리 및 롤백 구문에 따라 사용자에게 *"카테고리 일괄 이동 중 오류가 발생하여 원복되었습니다."* 안내 토스트 출력.
4. **네트워크 지연 피드백**:
   - 데이터 로딩 시 테이블 전체에 **Skeleton Screen** 적용.