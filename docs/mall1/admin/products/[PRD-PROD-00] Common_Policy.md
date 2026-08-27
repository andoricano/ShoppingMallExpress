# [PRD-PROD-00] 어드민 상품 모듈 공통 UI/UX 정책 및 데이터 스펙 (Common Policy & Specs)

## 1. 문서 개요 (Overview)

- **문서 목적**: 상품 관리 어드민 모듈 전체(`PRD-PROD-01` ~ `PRD-PROD-04`)에서 공통으로 적용되는 데이터 타입, 라우팅 구조, UI/UX 인터랙션 규칙, 권한 제어 및 예외 처리 정책을 정의합니다.
- **적용 범위**: 상품 목록, 상품 등록/수정 폼, 카테고리 트리 관리, 알림 및 대시보드 위젯 전반.

---

## 2. 공통 데이터 타입 및 Enum 정의 (Common Data Types & Enums)

### 2.1 상품 상태 (`ProductStatus`)
| Enum 값 | UI 표기명 | Badge 색상 | 설명 |
| :--- | :--- | :--- | :--- |
| `DISPLAY` | 진열중 | Green (#10B981) | 쇼핑몰 전시 API에 정상 노출되며 구매 가능. |
| `HIDDEN` | 숨김 | Yellow (#F59E0B) | 어드민 목록에만 노출되며 쇼핑몰 전시 API 조회 결과에서 제외. |
| `SOLD_OUT` | 품절 | Red (#EF4444) | 원천 재고 0 달성 시 자동 전환 또는 어드민 수동 설정. 상품 페이지 노출되나 구매 불가. |
| `DELETED` | 삭제됨 | Dark Gray (#6B7280) | Soft Delete 처리 상태. 클라이언트 API 및 모든 전시 목록에서 즉시 완전 차단. |

### 2.2 할인 유형 (`DiscountType`)
| Enum 값 | UI 표기명 | 단위 및 조건 |
| :--- | :--- | :--- |
| `PERCENT` | 정률 할인 | 단위: `%` (설정 가능 범위: 1 ~ 99) |
| `FIXED` | 정액 할인 | 단위: `원` (기본가 미만 금액만 입력 가능) |

### 2.3 카테고리 계층 (`CategoryLevel`)
| Enum 값 | UI 표기명 | 설명 |
| :--- | :--- | :--- |
| `DEPTH_1` | 대분류 | 최상위 카테고리 (GNB 메인 메뉴) |
| `DEPTH_2` | 중분류 | 중간 계층 카테고리 |
| `DEPTH_3` | 소분류 | 최하위 카테고리 (실제 상품 매핑 기본 단위) |

### 2.4 알림 유형 (`AlertType`)
| Enum 값 | UI 표기명 | 발생 조건 |
| :--- | :--- | :--- |
| `OUT_OF_STOCK` | 품절 알림 | 상품의 전 옵션/SKU 원천 재고가 0이 된 경우 |
| `LOW_STOCK` | 재고 임박 | 설정된 안전 재고(Safety Stock) 이하 수량 도달 시 |
| `SURGE_SALES` | 판매 급증 | 단위 시간(예: 1시간) 내 설정 수량 이상 판매 발생 시 |

---

## 3. 공통 UI/UX 정책 (Common UI/UX Policies)

### 3.1 사용자 피드백 정책 (Feedback)
- **토스트 메시지 (Toast)**:
  - 단발성 성공/실패 액션 피드백에 사용 (화면 우측 상단 3초간 노출 후 자동 소멸).
  - 성공(Green): `"상품 정보가 수정되었습니다."`
  - 실패(Red): `"요청 처리 중 오류가 발생했습니다. (사유: [Error Message])"`
- **로딩 스태이팅 (Loading)**:
  - 데이터 목록 로딩 시: **Skeleton Screen** 적용.
  - 저장/삭제 버튼 클릭 및 API 처리 중: **Button Spinner** 노출 및 클릭 차단 (`disabled`).

### 3.2 모달 및 컨펌 정책 (Modal & Confirm)
- **파괴적 액션 (Destructive Action)**:
  - 삭제, 데이터 원복 등 되돌리기 어려운 액션 시 반드시 **Alert Modal**을 호출하여 2차 확인 유도.
  - 삭제 Confirm 버튼은 Red Accent Color 적용.
- **페이지 이탈 방지 (Dirty Check)**:
  - 등록/수정 폼 작성 중 저장하지 않고 타 메뉴 이동, 탭 닫기, 뒤로가기 시 이탈 방지 모달 출력: *"작성 중인 내용이 있습니다. 정말 나가시겠습니까?"*

### 3.3 입력 폼 및 필터 정책 (Forms & Search)
- **검색 디바운싱 (Debounce)**:
  - 텍스트 검색어 실시간 입력 조회의 경우 300ms 디바운스 적용.
- **금액 및 숫자 입력**:
  - 천 단위 콤마(`,`) 자동 적용 및 숫자 전용 키패드/유효성 검증 적용.

---

## 4. 어드민 권한 및 접근 제어 (Roles & Permissions)

| 기능 / 액션 | Super Admin | Master Seller | Product Operator | Read-Only Admin |
| :--- | :---: | :---: | :---: | :---: |
| **상품 목록 및 상세 조회** | O | O | O | O |
| **신규 상품 등록 / 정보 수정** | O | O | O | X |
| **일괄 상태 변경 및 카테고리 이동** | O | O | O | X |
| **상품 삭제 (Soft Delete)** | O | O | X | X |
| **카테고리 구조 수정 / 삭제** | O | O | X | X |

* 권한이 없는 액션 시도 시 해당 버튼 비활성화(`disabled`) 처리 및 툴팁으로 *"권한이 없습니다"* 안내.

---

## 5. 공통 예외 처리 및 에러 스펙 (Exception Handling)

### 5.1 HTTP 에러 코드 대응 정책
- **`400 Bad Request`**: 클라이언트 Validation 실패. 해당 폼 필드 하단에 Red 텍스트로 에러 메시지 바인딩.
- **`401 Unauthorized / 403 Forbidden`**: 권한 없음 토스트 노출 후 어드민 로그인 페이지(`/admin/login`)로 강제 리다이렉트.
- **`409 Conflict`**: 동시 수정(Optimistic Lock Fail) 발생 시 컨펌 모달 출력: *"다른 관리자에 의해 최신 정보가 변경되었습니다. 페이지를 새로고침합니다."*
- **`500 Internal Server Error`**: *"일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요."* 시스템 알림 토스트 출력.

---

## 6. 라우팅 및 페이지 구조 스펙 (Routing & Page Specifications)

### 6.1 관리자 라우트 명세 (Admin Page Routes)
| 라우트 경로 | 페이지명 | 주요 기능 및 역할 | 연동 Custom Hook |
| :--- | :--- | :--- | :--- |
| `/admin/products` | 상품 목록 및 일괄 관리 | • 카테고리/상태/검색어 필터링 및 페이징<br/>• 선택 상품 일괄 변경(진열 상태, 카테고리 이동)<br/>• 단일 삭제(Soft Delete) 및 수정 페이지 이동 | `useAdminProducts` |
| `/admin/products/new` | 신규 상품 등록 | • 상품 기본 정보, 상세 설명(Rich Text Editor), 이미지 갤러리 업로드<br/>• 카테고리 다중 매핑 및 원천 SKU/옵션 설정 | `useAdminProductDetail`<br/>`useProductForm` |
| `/admin/products/[id]/edit` | 상품 정보 수정 | • 기존 상품 데이터 조회 및 폼 자동 바인딩<br/>• 상품 내용/옵션/상태 변경 및 이탈 방지 Dirty Check | `useAdminProductDetail`<br/>`useProductForm` |


### 6.2 페이지 아키텍처 및 화면 구성 (Page Architecture)
3개의 메인 라우트별 레이아웃 구조와 각 페이지를 구성하는 UI 섹션/컴포넌트의 포함 관계(Composition)입니다.

```text
[ Admin Global Layout ]
│
├── 1. 상품 목록 페이지 (/admin/products)
│   ├── [Header] 페이지 타이틀 + '신규 상품 등록' 버튼
│   ├── [Filter Bar] 검색어 입력 + 카테고리 계층 필터 + 진열 상태 필터 + 초기화
│   ├── [Batch Action Toolbar] 선택 항목 카테고리 일괄 이동 / 상태 일괄 변경 / 일괄 삭제
│   └── [Data Table] 상품 목록 데이터 그리드
│       ├── 이미지, 상품명, 카테고리, 판매가, 재고, 상태 Badge, 관리 액션(수정/삭제)
│       ├── Pagination & Page Size Control
│       ├── [Modal] BatchStatusModal (일괄 상태 변경 레이어)
│       └── [Modal] BatchCategoryModal (일괄 카테고리 이동 레이어)
│
├── 2. 상품 등록 페이지 (/admin/products/new)
│   ├── [Header] '신규 상품 등록' 타이틀 + '취소' & '저장' 버튼 (Sticky Header)
│   └── [Main Form: ProductForm]
│       ├── [Basic Info Section] 상품명, 카테고리(대/중/소), 진열 상태, 검색 태그
│       ├── [Price & Stock Section] 정상가, 판매가, 할인 설정(정률/정액), 기본 재고 수량
│       ├── [Media Section: ImageUploader] 대표 이미지 + 추가 갤러리 이미지 업로드
│       ├── [Option Section: OptionManager] 옵션 항목/값 조합 생성 + SKU별 가격/재고 매핑
│       └── [Detail Content Section: RichTextEditor] WYSIWYG/MD 상세 설명 에디터
│
└── 3. 상품 수정 페이지 (/admin/products/[id]/edit)
    ├── [Header] '상품 정보 수정' 타이틀 + '취소' & '삭제' & '수정 완료' 버튼 (Sticky Header)
    └── [Main Form: ProductForm] (initialData 바인딩)
        ├── [Basic Info Section] 기존 상품 기본 정보 자동 세팅 및 수정
        ├── [Price & Stock Section] 기존 가격/할인율/재고 조회 및 수정
        ├── [Media Section: ImageUploader] 기존 이미지 프리뷰 및 순서 변경/추가/삭제
        ├── [Option Section: OptionManager] 기존 SKU/옵션 테이블 조회 및 수량 조정
        └── [Detail Content Section: RichTextEditor] 기존 상세 설명 데이터 로드 및 수정