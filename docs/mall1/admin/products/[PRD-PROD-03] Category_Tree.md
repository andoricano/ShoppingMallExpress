# [PRD-PROD-03] 계층형 카테고리 트리 관리 (Category Tree Management)

## 1. 화면 개요 (Screen Overview)

- **화면 경로**: `/admin/products/categories`
- **화면 목적**: 쇼핑몰의 계층형 카테고리(대/중/소) 트리 구조를 관리하고, 카테고리의 생성·수정·삭제·순서 변경(Drag & Drop) 및 전시 노출 여부를 설정하는 인터페이스 제공.
- **주요 사용자**: 어드민 관리자, 상품 운영 담당자

---

## 2. 기능 요구사항 (Functional Requirements)

### 2.1 카테고리 트리 뷰 (Tree View Interaction)
- **계층 구조 지원**: 최대 3단계(Depth 1: 대분류, Depth 2: 중분류, Depth 3: 소분류) 계층 노드 표시.
- **트리 펼침/접힘 (Expand/Collapse)**:
  - 각 노드 좌측 아이콘으로 하위 카테고리 접기/펼치기 가능.
  - [전체 펼치기] / [전체 접기] 상단 토글 버튼 제공.
- **드래그 앤 드롭 (Drag & Drop) 순서 및 계층 변경**:
  - 마우스 드래그를 통한 동일 계층 내 노출 순서(Sort Order) 변경.
  - 상위 노드로 드래그하여 소속 계층 이동 (단, 최대 Depth 3 제한 준수).
  - 변경 발생 시 [순서 저장] 버튼 활성화 및 저장 시 일괄 API 연동.
- **노드 선택 (Node Selection)**:
  - 특정 카테고리 노드 클릭 시 우측 '카테고리 상세 설정' 영역에 해당 카테고리 데이터 바인딩.

---

### 2.2 카테고리 상세 설정 및 생성/수정 (Category Form)
- **기본 정보**:
  - **카테고리 ID (`category_id`)**: UUID (Read-Only).
  - **카테고리명 (`category_name`)**: 텍스트 입력 (필수, 최대 50자).
  - **상위 카테고리 (`parent_category_id`)**: 드롭다운 선택 (최상위 대분류 지정 시 '없음' 선택).
- **노출 상태 (`status`)**:
  - `DISPLAY` (진열중) / `HIDDEN` (숨김) 선택.
  - 상위 카테고리가 `HIDDEN`으로 변경될 경우, 하위 카테고리 전체가 Client 전시 API 조회에서 동시 숨김 처리.
- **노출 순서 (`sort_order`)**: 숫자 입력 (동일 계층 내 정렬 순서).
- **연관 데이터 표시 (Read-Only Info)**:
  - **매핑된 상품 수**: 해당 카테고리에 지정된 상품 개수 노출 및 [해당 상품 목록 보기] 링크 제공 (클릭 시 `/admin/products?categoryId=xxx`로 이동).

---

### 2.3 카테고리 생성 / 삭제 (Node Operations)

#### A. 카테고리 신규 추가
1. **[+ 최상위 카테고리 추가]** 또는 선택 노드 우측 **[+ 하위 추가]** 버튼 클릭.
2. 우측 입력 폼이 신규 카테고리 작성 모드로 전환.
3. 데이터 입력 후 [생성] 클릭 시 유효성 검사 후 저장.

#### B. 카테고리 삭제 (Safety Check Rules)
1. 카테고리 노드 우측 **[삭제]** 버튼 클릭 시 삭제 가능 여부 사전 검증:
   - **하위 카테고리가 존재하는 경우**: 삭제 불가 ("하위 카테고리가 존재합니다. 하위 항목을 먼저 삭제하거나 이동해주세요.")
   - **매핑된 상품이 존재하는 경우**: 삭제 불가 ("해당 카테고리에 매핑된 상품이 N개 존재합니다. 상품 카테고리를 먼저 변경해주세요.")
2. 안전 조건 충족 시 Confirm Alert Modal 호출 후 DB 물리 삭제 또는 Soft Delete 처리.

---

## 3. 유효성 검사 및 제한 규칙 (Validation & Constraints)

| 구분 | 규칙 및 조건 | 비고 / 에러 메시지 |
| :--- | :--- | :--- |
| **최대 Depth 제한** | 최대 3단계(Depth 3)까지만 생성 및 이동 가능 | Depth 3 하위로 드래그 시 이동 불가능 처리 (Drop Zone 비활성화) |
| **카테고리명** | 필수 입력, 1~50자 | "카테고리명을 입력해주세요. (최대 50자)" |
| **중복 명칭 검증** | 동일 상위 노드 내 중복 카테고리명 불허 | "동일 계층 내에 이미 존재하는 카테고리명입니다." |
| **삭제 제한** | 하위 노드 존재 또는 매핑 상품 수 > 0 시 삭제 차단 | "연관된 상품 또는 하위 카테고리가 있어 삭제할 수 없습니다." |

---

## 4. API 연동 매핑 (API Interface Mapping)

| UI 이벤트 / 액션 | HTTP Method & Endpoint | Request / Response Payload | 비고 |
| :--- | :--- | :--- | :--- |
| **전체 카테고리 트리 로딩** | `GET /api/admin/categories/tree` | Response: 계층형 Tree JSON 구조 | 전체 트리 조회 |
| **카테고리 신규 생성** | `POST /api/admin/categories` | `body: { name, parentId, status, sortOrder }` | 신규 노드 추가 |
| **카테고리 정보 수정** | `PUT /api/admin/categories/:id` | `params: { id }`, `body: { name, status, ... }` | 단일 노드 수정 |
| **트리 구조/순서 일괄 변경** | `PATCH /api/admin/categories/reorder` | `body: { items: [{ id, parentId, sortOrder }] }` | Drag & Drop 후 저장 |
| **카테고리 삭제** | `DELETE /api/admin/categories/:id` | `params: { id }` | 안전 검증 후 삭제 |

---

## 5. 예외 처리 및 UI 피드백 (Exception Handling)

1. **Drag & Drop 순서 변경 후 미저장 이탈 시**:
   - 트리 순서를 변경했으나 [순서 저장]을 누르지 않고 타 메뉴 이동 시 Dirty Check 경고 모달 출력.
2. **카테고리 삭제 차단 인터랙션**:
   - 삭제 버튼에 마우스 호버 시 매핑 상품 수/하위 카테고리 존재 여부를 체크하여 조건 미달 시 버튼 비활성화(`disabled`) 및 툴팁으로 사유 표시.
3. **상위 카테고리 숨김 설정 시 알림**:
   - 상위 카테고리를 `HIDDEN`으로 변경하려 할 때 안내 모달 출력: *"상위 카테고리를 숨김 처리하면 모든 하위 카테고리 및 해당 상품들이 사용자 화면에 노출되지 않습니다. 진행하시겠습니까?"*