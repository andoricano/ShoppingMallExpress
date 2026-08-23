# [PRD] 상품 목록 페이지 (`/products`)

## 1. 개요
* **목적**: 쇼핑몰의 전체 및 카테고리별 상품 목록을 조회하고, 정렬(Sort) 기능을 통해 원하는 상품을 빠르게 찾을 수 있도록 지원
* **경로**: `/products` (쿼리 파라미터: `?categoryId=...&sort=...`)

---

## 2. 화면 구성 및 상세 요구사항

### 2.1. 카테고리 필터 탭 (Category Nav)
* **UI**: 상단 수평 스크롤/탭 형태 (대분류 카테고리 목록)
* **동작**:
  * "전체" 및 등록된 대분류 카테고리 탭 표시
  * 탭 클릭 시 URL 쿼리 파라미터(`categoryId`) 업데이트 및 해당 카테고리 상품 필터링

### 2.2. 정렬 옵션 드롭다운 (Sort Selector)
* **UI**: 우측 상단 드롭다운
* **옵션** (`ProductSortOption` 타입 매핑):
  * `RECOMMENDED` (추천순 / 기본값)
  * `NEWEST` (신상품순)
  * `PRICE_ASC` (낮은 가격순)
  * `PRICE_DESC` (높은 가격순)

### 2.3. 상품 그리드 (Product Grid)
* **UI**: 4열 그리드 (Desktop 기준, Responsive)
* **요소**: `ProductCard` 재사용 (이미지, 상품명, 정상가/할인가, 할인율)
* **예외 처리**: 조건에 맞는 상품이 없을 경우 빈 상태(Empty State) UI 노출