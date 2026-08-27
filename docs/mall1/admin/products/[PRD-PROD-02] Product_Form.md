# [PRD-PROD-02] 어드민 상품 등록 및 수정 (Product Form - Create & Edit)

## 1. 화면 개요 (Screen Overview)

- **화면 경로**: 
  - 신규 등록: `/admin/products/new`
  - 정보 수정: `/admin/products/:id/edit`
- **화면 목적**: 원천 재고(SKU) 데이터를 기반으로 판매 상품의 기본 정보, 카테고리 매핑, 할인 정책, 옵션 구성 및 상세 내용을 등록·수정하는 인터페이스 제공.
- **주요 사용자**: 어드민 관리자, 상품 운영 담당자

---

## 2. 입력 섹션별 기능 명세 (Section Specifications)

### 2.1 기본 정보 (Basic Information)
- **상품명 (`product_name`)**: 텍스트 입력 (필수, 최대 100자).
- **진열 상태 (`status`)**: 라디오 버튼 또는 세그먼트 컨트롤 (`DISPLAY` [진열중], `HIDDEN` [숨김]).
  - 기본값: `DISPLAY`
- **진열 우선순위 (`sort_order`)**: 숫자 입력 (선택, 기본값 `0`). 숫자가 낮을수록 쇼핑몰 상단 노출.

### 2.2 카테고리 매핑 (Category Mapping)
- **카테고리 선택 UI**: 계층형 드롭다운 선택 후 [추가] 버튼을 통해 태그 형태(Tag Chips)로 다중 매핑.
- **다중 카테고리 지정**: 1개 이상의 카테고리 매핑 필수.
- **대표 카테고리 설정**: 매핑된 카테고리 중 1개를 대표 카테고리로 지정 (GNB/Breadcrumb 노출 기준).

### 2.3 가격 및 할인 정책 (Pricing & Discount)
- **기본가 (`base_price`)**: 숫자 입력 (필수, 0원 이상).
- **할인 적용 여부**: 스위치 토글 (기본 OFF).
- **할인 정책 설정 (토글 ON 시 활성화)**:
  - **할인 유형 (`discount_type`)**: 드롭다운 또는 라디오 (`PERCENT` [정률 %], `FIXED` [정액 원]).
  - **할인값 (`discount_value`)**: 숫자 입력 (정률 시 1~99%, 정액 시 기본가 미만).
  - **할인 기간 (`discount_start_at`, `discount_end_at`)**: Datetime Range Picker (시작일시~종료일시 지정). 미지정 시 상시 할인.
- **실시간 예상 판매가 라이브 뷰어 (Live Preview)**:
  - 입력된 기본가와 할인 정책에 따라 자동 계산된 최종 판매가(`discounted_price`) 및 할인율을 실시간 계산하여 볼드체로 노출.

### 2.4 원천 재고 & 옵션 매핑 (SKU & Option Link)
- **옵션 사용 여부**: 스위치 토글 (단일 상품 / 옵션 상품 구분).
- **SKU 연동 모달**:
  - `재고 모듈`에 등록된 SKU 데이터(`SkuInventory.id`) 검색 및 선택 모달 제공.
  - 검색 조건: SKU 코드, 원천 자재명, 재고 수량.
- **옵션 매핑 테이블**:
  - **옵션명 / 옵션값**: 예) 색상(Red, Blue) / 사이즈(S, M, L).
  - **옵션별 추가금 (`surcharge`)**: 각 옵션 조합별 추가 금액 설정 (+/- 입력 가능).
  - **매핑 SKU (`sku_id`)**: 선택된 SKU ID 결합.
  - **재고 상태 (Read-Only)**: 매핑된 SKU의 실시간 원천 재고 수량 노출.

### 2.5 이미지 및 상세 설명 (Images & Description)
- **대표 이미지 (`main_image_url`)**: 1개 필수, 드래그 앤 드롭 파일 업로드 (권장 규격: 1000x1000px, JPG/PNG/WEBP, 최대 5MB).
- **추가 이미지 (`sub_image_urls`)**: 최대 10개, 드래그 앤 드롭 업로드 및 순서 변경(Reorder) 지원.
- **상세 설명 (`description`)**: 
  - WYSIWYG 또는 Markdown 에디터 제공.
  - 에디터 내 이미지 직접 첨부(CDN 자동 업로드) 및 HTML/MD 가공 지원.

### 2.6 하단 고정 액션 바 (Sticky Footer)
- 화면 하단 스티키 바 영역 구성.
- **[취소]**: 변경 사항 작성 중일 경우 "저장되지 않은 변경사항이 있습니다" 경고 모달 출력 후 이전 목록 페이지로 이동.
- **[임시 저장 / 저장]**: Client Validation 수행 후 API 연동 및 성공 시 목록 페이지(`/admin/products`)로 리다이렉트.

---

## 3. 폼 유효성 검사 규칙 (Form Validation Rules)

| 필드 | 검증 조건 (Validation Rules) | 오류 발생 시 에러 메시지 |
| :--- | :--- | :--- |
| **상품명** | 필수 입력, 1~100자 | "상품명을 입력해주세요. (최대 100자)" |
| **카테고리** | 최소 1개 이상 매핑 | "최소 하나의 카테고리를 선택해야 합니다." |
| **기본가** | 필수 입력, 0 이상의 정수 | "올바른 기본가를 입력해주세요." |
| **할인율 (%)** | 정률 선택 시 1 ~ 99 범위의 정수 | "할인율은 1%에서 99% 사이여야 합니다." |
| **할인가 (원)** | 정액 선택 시 기본가보다 작은 금액 | "할인 금액은 기본가보다 작아야 합니다." |
| **할인 기간** | 종료일시가 시작일시보다 미래 시점 | "할인 종료 일시는 시작 일시보다 이후여야 합니다." |
| **옵션 SKU** | 옵션 사용 설정 시 모든 옵션 조합에 SKU 매핑 필수 | "모든 옵션 조합에 원천 SKU를 매핑해주세요." |
| **대표 이미지** | 1개 필수 등록 | "대표 이미지를 최소 1개 이상 등록해주세요." |

---

## 4. API 연동 매핑 (API Interface Mapping)

| UI 이벤트 / 액션 | HTTP Method & Endpoint | Request / Response Payload Key | 비고 |
| :--- | :--- | :--- | :--- |
| **수정 데이터 조회** | `GET /api/admin/products/:id` | `params: { id }` | 수정 페이지 진입 시 기존 데이터 바인딩 |
| **원천 SKU 검색** | `GET /api/admin/skus` | `query: { keyword, page, limit }` | SKU 매핑 모달 내 검색 |
| **신규 상품 등록** | `POST /api/admin/products` | `body: { name, basePrice, discountPolicy, categories, options, images, ... }` | 등록 처리 |
| **상품 정보 수정** | `PUT /api/admin/products/:id` | `params: { id }`, `body: { ... }` | 수정 처리 |
| **이미지 업로드** | `POST /api/admin/assets/upload` | `multipart/form-data` | CDN 이미지 URL 반환 |

---

## 5. 예외 처리 및 UI/UX 피드백 (Exception Handling)

1. **원천 SKU 재고 부족/품절 매핑 시**:
   - 재고가 0인 SKU를 매핑하더라도 상품 등록은 허용하되, 해당 옵션 옆에 `[원천 품절]` 태그 표기.
2. **저장 처리 중 네트워크 오류**:
   - 저장 버튼 내 스피너 노출 및 중복 클릭 차단 (Debounce/Disable 처리).
   - 저장 실패 시 상단 토스트 메시지로 서버 에러 사유 출력 ("저장에 실패했습니다: [에러 사유]").
3. **작성 중 페이지 이탈 방지 (Dirty Check)**:
   - 폼 입력값이 변경된 상태에서 브라우저 뒤로가기, 탭 닫기, 타 메뉴 이동 시 경고 컨펌창 노출.