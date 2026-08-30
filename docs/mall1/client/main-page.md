# [PRD] 메인 페이지 (Main Page)

> Client가 쇼핑몰 진입 시 가장 먼저 확인하는 페이지입니다.
>
> 메인 페이지는 비개발자가 Admin에서 **사전에 제공되는 Section과 Layout을 조합하여 구성**할 수 있어야 합니다.
>
> Client는 Admin에서 구성된 메인 페이지를 Read-Only로 조회합니다.

---

## 1. 개요

메인 페이지는 여러 개의 Section으로 구성합니다.

```text
Header
   ↓
Hero
   ↓
Product Section
   ↓
Product Section
   ↓
...
   ↓
Footer
```

Admin은 Section의 종류, 표시 순서, 활성 상태 및 콘텐츠를 관리할 수 있습니다.

---

## 2. Section

메인 페이지에서 사용할 수 있는 Section은 개발자가 미리 정의합니다.

```ts
type MainSectionType =
    | "HERO"
    | "PRODUCT"
    | "CATEGORY"
    | "BANNER"
    | "FOOTER";
```

Admin은 직접 HTML이나 TSX 코드를 작성하지 않고,
제공된 Section을 선택하여 메인 페이지를 구성합니다.

### 2.1 Section 공통 정보

```ts
interface MainSectionBase {
    id: string;
    type: MainSectionType;
    order: number;
    isActive: boolean;
}
```

---

## 3. Product Section

대표 상품, 신상품, 추천 상품 등의 상품 영역은 하나의 **Product Section**으로 통합합니다.

상품을 표시하는 방식만 Layout으로 구분합니다.

```ts
type ProductSectionLayout =
    | "GRID"
    | "HORIZONTAL_SCROLL"
    | "LARGE";
```

예:

```text
대표 상품
└─ GRID

신상품
└─ HORIZONTAL_SCROLL

추천 상품
└─ GRID
```

### Product Section 관리

Admin은 다음 항목을 설정할 수 있어야 합니다.

* Section 제목
* 노출 Product 선택
* Product 표시 순서
* Layout 선택
* Section 활성/비활성

```ts
interface ProductSection extends MainSectionBase {
    type: "PRODUCT";
    title: string;
    productIds: string[];
    layout: ProductSectionLayout;
}
```

---

## 4. Hero Section

메인 페이지의 대표 상품 또는 주요 콘텐츠를 크게 노출하는 영역입니다.

```ts
interface HeroSection extends MainSectionBase {
    type: "HERO";
    productId?: string;
    imageUrl?: string;
    title?: string;
    description?: string;
}
```

Admin은 Hero에 사용할 Product 또는 콘텐츠를 선택할 수 있어야 합니다.

---

## 5. Category Section

상품 카테고리를 메뉴 형태로 보여주는 영역입니다.

```ts
interface CategorySection extends MainSectionBase {
    type: "CATEGORY";
    categoryIds: string[];
}
```

Admin은 표시할 Category와 순서를 설정할 수 있어야 합니다.

---

## 6. Banner Section

상품 또는 이벤트 등의 콘텐츠를 이미지 중심으로 노출하는 영역입니다.

```ts
interface BannerSection extends MainSectionBase {
    type: "BANNER";
    imageUrl: string;
    title?: string;
    description?: string;
    link?: string;
}
```

---

## 7. Footer Section

사업자 정보와 고객센터 등의 쇼핑몰 기본 정보를 표시합니다.

Footer는 일반 Section과 달리 페이지 하단에 고정된 영역으로 관리할 수 있습니다.

관리 정보:

* 사업자명
* 대표자명
* 사업자 등록 정보
* 주소
* 고객센터 정보
* 기타 사업자 정보

---

## 8. Main Page 구성

메인 페이지는 Section 목록의 순서대로 렌더링합니다.

```ts
interface ClientPageConfig {
    id: string;
    sections: MainSection[];
}
```

예:

```text
ClientPageConfig
│
├─ Header
├─ Hero
├─ Product Section
│   └─ 대표 상품 / GRID
├─ Product Section
│   └─ 신상품 / HORIZONTAL_SCROLL
├─ Banner
└─ Footer
```

Admin에서 Section의 순서를 변경하면 Client의 메인 페이지에도 동일한 순서로 반영됩니다.

---

## 9. Client

* 활성 상태의 Section만 표시합니다.
* Section의 Layout에 따라 UI를 렌더링합니다.
* 비활성 Product는 노출하지 않습니다.
* 삭제된 Product는 노출 대상에서 제외합니다.
* 메인 페이지 설정은 Read-Only로 제공합니다.

---

## 10. Admin

Admin은 다음 기능을 제공합니다.

* Section 추가
* Section 삭제
* Section 순서 변경
* Section 활성/비활성
* Section 종류 선택
* Section Layout 선택
* Product 선택 및 순서 변경
* Hero 콘텐츠 설정
* Category 선택 및 순서 변경
* Banner 콘텐츠 설정
* Footer 정보 관리

---

## 11. 디자인 시스템

메인 페이지는 자유로운 HTML/CSS 또는 TSX 코드 입력 방식으로 구성하지 않습니다.

Admin은 개발자가 제공하는 **Section + Layout + Content 설정**을 조합합니다.

```text
Section
├─ Type
├─ Layout
├─ Content
└─ Design
```

예:

```text
PRODUCT
├─ GRID
├─ HORIZONTAL_SCROLL
└─ LARGE

HERO
└─ DEFAULT

CATEGORY
└─ DEFAULT

BANNER
└─ IMAGE

FOOTER
└─ BUSINESS
```

실제 React Component와 스타일은 Client Web에서 관리하며,
Admin의 설정값에 따라 해당 Component를 SSR로 렌더링합니다.
