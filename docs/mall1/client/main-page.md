# [PRD] 메인 페이지 (`/`)

## 1. 개요
* **목적**: 브랜드의 핵심 정체성을 전달하고, 주력 상품(Featured Items)으로의 클릭/구매 전환을 유도
* **경로**: `/`
* **주요 구성 요소**: Hero Banner, Featured Items Section, Brand Story Section

---

## 2. 화면 구성 및 상세 요구사항

### 2.1. Hero Banner (상단 메인 비주얼)
* **UI**: 화면 상단에 위치하는 대형 비주얼 영역 (높이 500px~600px)
* **요소**:
  * 메인 카피 (예: "매일을 채우는 프리미엄 라이프스타일")
  * 서브 카피 (브랜드 메시지 1~2줄)
  * C2A 버튼: `[지금 둘러보기]` -> 클릭 시 `/products`로 이동

### 2.2. Featured Items (주력/신상품 섹션)
* **UI**: 3~4열 그리드 레이아웃 (Desktop 기준)
* **요소**:
  * 섹션 타이틀 ("Best Items" 또는 "Featured Collection")
  * 상품 카드 컴포넌트:
    * 상품 대표 이미지 (Hover 시 이미지 약간 확대 또는 서브 이미지 교체 효과)
    * 상품명, 태그(BEST/NEW), 가격
    * Quick Add (장바구니 담기) 아이콘 버튼

### 2.3. Brand Story (브랜드 소개 섹션)
* **UI**: 텍스트 + 이미지 2열 분hal 레이아웃
* **요소**:
  * 브랜드 철학 및 가치관 전달 텍스트
  * 브랜드 컨셉 이미지

---

## 3. 필요 컴포넌트
* `HeroBanner.tsx`
* `ProductGrid.tsx` / `ProductCard.tsx`
* `BrandStory.tsx`