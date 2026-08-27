## 6. 라우팅 및 페이지 구조 스펙 (Routing & Page Specifications)

### 6.1 관리자 라우트 명세 (Admin Page Routes)

| 라우트 경로 | 페이지명 | 주요 기능 및 역할 | 연동 Custom Hook |
| :--- | :--- | :--- | :--- |
| `/admin/products` | 상품 목록 및 일괄 관리 | 카테고리/상태/검색어 필터링 및 페이징, 상품 일괄 관리 | `useAdminProducts` |
| `/admin/products/new` | 신규 상품 등록 | 상품 기본 정보, 상세 설명, 이미지 갤러리, 카테고리, 원천 SKU/옵션 설정 | `useAdminProductDetail`, `useProductForm` |
| `/admin/products/[id]/edit` | 상품 정보 수정 | 기존 상품 데이터 조회 및 상품 정보/옵션/상태 변경 | `useAdminProductDetail`, `useProductForm` |
| `/admin/products/categories` | 카테고리 관리 | 카테고리 트리 CRUD, 계층 변경 및 순서 관리 | `useAdminCategories` |
| `/admin/products/alerts` | 상품 알림 센터 | 품절/재고 임박/판매 급증 알림 조회 및 관리 | `useProductAlerts` |
| `/admin/dashboard` | 관리자 대시보드 | 상품 관련 알림 및 주요 재고 상태 위젯 | `useDashboardProductAlerts` |


### 6.2 페이지 구조

```text
[ Admin Global Layout ]

├── 1. 상품 목록 페이지 (/admin/products)
│   ├── [Header] 페이지 타이틀 + '신규 상품 등록' 버튼
│   ├── [Filter Bar] 검색어 + 카테고리 + 진열 상태 + 초기화
│   ├── [Batch Action Toolbar]
│   │   ├── 진열 상태 일괄 변경
│   │   └── 카테고리 일괄 이동
│   └── [Data Table]
│       ├── 상품 목록
│       ├── Pagination
│       └── 관리 액션
│
├── 2. 상품 등록 페이지 (/admin/products/new)
│   ├── [Header] '신규 상품 등록' + '취소' + '저장'
│   └── [Main Form: ProductForm]
│       ├── [Basic Info Section]
│       ├── [Price & Discount Section]
│       ├── [Category Section]
│       ├── [SKU & Option Section]
│       ├── [Media Section]
│       └── [Detail Content Section]
│
├── 3. 상품 수정 페이지 (/admin/products/[id]/edit)
│   ├── [Header] '상품 정보 수정' + '취소' + '삭제' + '수정 완료'
│   └── [Main Form: ProductForm]
│       ├── [Basic Info Section]
│       ├── [Price & Discount Section]
│       ├── [Category Section]
│       ├── [SKU & Option Section]
│       ├── [Media Section]
│       └── [Detail Content Section]
│
├── 4. 카테고리 관리 페이지 (/admin/products/categories)
│   ├── [Header] 카테고리 관리 + '최상위 카테고리 추가'
│   ├── [Category Tree]
│   │   ├── Depth 1
│   │   ├── Depth 2
│   │   └── Depth 3
│   └── [Category Detail/Form]
│
├── 5. 상품 알림 센터 (/admin/products/alerts)
│   ├── [Filter Bar]
│   ├── [Alert Table]
│   └── [Batch Read Action]
│
└── 6. 관리자 대시보드 (/admin/dashboard)
    ├── [Low Stock / Out of Stock Widget]
    └── [Surge Sales Widget]