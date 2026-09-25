# Architecture

## 개요

이 저장소는 pnpm 9 workspace와 Turborepo 2 기반 monorepo다.

Workspace 범위는:

```text
apps/*
packages/*
```

이며, 루트 Node.js 요구 버전은 18 이상이다.

Turborepo는 주로 다음 task를 조정한다.

```text
build
lint
check-types
dev
```

Mall v2는 기존 Express API 중심 구조에서 벗어나:

```text
Next.js
+
Supabase
+
RLS
+
Supabase RPC
+
필요한 경우 Next Route Handler
```

를 기본 application architecture로 사용한다.

`apps/api`의 기존 Express 서버는 삭제되었고 Mall v2의 실행 경계가 아니다. 명시적인 기술적 필요가 확인되지 않는 한 복원하지 않는다.

---

## Applications

| Workspace          | 역할                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `apps/client-pwa`  | 고객용 Next.js PWA. ProductPost, Product, ProductVariant, Cart, Order 등 Consumer flow를 담당한다.                                |
| `apps/client-web`  | 고객용 Next.js 웹. 상품 조회, 장바구니, 관심상품, 주문, 마이페이지, History/Refund 등의 Consumer flow를 담당한다.                                      |
| `apps/user-web`    | 현재 Admin application. Product, ProductPost, ProductOption, ProductVariant, Warehouse/Ware, Order, Refund 등의 관리 기능을 담당한다. |
| `apps/api`         | 삭제됨(Legacy Express API). Mall v2의 architecture가 아니며 현재 workspace에 존재하지 않는다. 명시적인 요구가 없는 한 복원하지 않는다.                            |

---

## Shared packages

| Workspace                    | 역할                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/types`             | Mall domain과 application 간 공유 타입의 source. Product, ProductVariant, Cart, Order 등의 contract를 정의한다. |
| `packages/constants`         | 공유 상수의 source.                                                                                    |
| `packages/mall-page-viewer`  | ProductPost/Page 렌더링에 사용되는 shared React package.                                                  |
| `packages/category-tree`     | Admin category UI에서 사용하는 shared React package.                                                    |
| `packages/tiptap`            | Tiptap/React 기반 editor package.                                                                   |
| `packages/eslint-config`     | 공유 ESLint 설정.                                                                                     |
| `packages/typescript-config` | 공유 TypeScript 설정.                                                                                 |

---

## Mall v2 Source of Truth

Mall v2 product / commerce / warehouse 구조는 다음을 우선 Source of Truth로 사용한다.

1. `docs/mall1/v2/product-schema.md`
2. Mall v2 SQL files
3. `docs/mall1/v2/PHASES.md`
4. `packages/types`

기존 Express API 기반 문서와 legacy Inventory/SkuInventory 구조는 새로운 Mall v2 architecture의 기준으로 사용하지 않는다.

`docs/api/README.md`는 legacy API contract를 포함할 수 있으며, 최신 Mall v2 SQL/domain contract와 충돌할 경우 Mall v2 문서를 우선한다.

---

## Mall v2 Database Contract

Mall v2 database는 다음 SQL 파일 순서로 구성한다.

```text
01_tables.sql
02_indexes_constraints.sql
03_rls.sql
04_rpc_product.sql
05_rpc_order.sql
06_rpc_warehouse.sql
07_triggers.sql
08_seed.sql
```

각 파일의 역할:

```text
01_tables.sql
→ tables / columns / primary keys

02_indexes_constraints.sql
→ foreign keys / unique / check / indexes

03_rls.sql
→ Consumer/Admin access boundaries

04_rpc_product.sql
→ Product/ProductPost consumer-safe queries
→ ProductVariant availability
→ ProductVariant option validation

05_rpc_order.sql
→ Cart
→ Order creation
→ OrderItem snapshot
→ stock deduction
→ cancellation
→ History
→ Refund request

06_rpc_warehouse.sql
→ Warehouse/Ware internal management
→ stock adjustment/reservation/transfer/restock

07_triggers.sql
→ updated_at
→ ProductVariant integrity
→ immutable OrderItem snapshot protection

08_seed.sql
→ minimum stable seed data
```

---

## Core Domain Structure

Mall v2의 중심 domain은 다음과 같다.

```text
ProductPost
    ↕ N:N
Product
    ├─ ProductOption
    │    └─ ProductOptionValue
    │
    └─ ProductVariant
            ↕
           Ware
            ↓
        Warehouse
```

### ProductPost

Consumer에게 상품을 표현하는 content entity다.

`ProductPost : Product = N:N` 관계를 가진다.

Wishlist와 Category는 ProductPost 기준이다.

---

### Product

판매 상품의 공통 정보를 가진다.

Product는 더 이상 legacy `inventoryId`를 소유하지 않는다.

실제 구매 가격과 구매 단위는 ProductVariant가 담당한다.

---

### ProductOption / ProductOptionValue

Product의 선택 구조를 정의한다.

예:

```text
Color
→ Black
→ White

Size
→ S
→ M
→ L
```

---

### ProductVariant

실제 판매 가능한 unit이다.

ProductVariant는 다음 개념을 담당한다.

```text
price
skuCode
active state
ProductOptionValue combination
```

Consumer의 실제 구매 단위는 ProductVariant다.

---

## Warehouse Domain

`Warehouse`와 `Ware`는 Mall v2의 내부 재고 domain이다.

```text
Warehouse
  ↓
Ware
```

Ware는 ProductVariant 없이도 존재할 수 있다.

예:

```text
판매 상품 재고
미판매 재고
포장재
사은품
반품 재고
원자재
기타 내부 보유품
```

ProductVariant와 Ware는 relation table을 통해 연결된다.

```text
ProductVariant
      ↕
product_variant_wares
      ↕
Ware
```

하나의 ProductVariant는 여러 Ware와 연결될 수 있다.

---

## Consumer Exposure Boundary

Ware와 Warehouse는 Consumer에게 절대 직접 노출하지 않는다.

Consumer API / UI / RPC response에서 다음을 직접 노출하지 않는다.

```text
wareId
warehouseId
Ware
Warehouse
product_variant_wares
order_item_ware_allocations
currentStock
reservedStock
internal warehouse metadata
```

Consumer는 다음 domain만 기준으로 동작한다.

```text
ProductPost
Product
ProductOption
ProductOptionValue
ProductVariant
Cart
Order
History
Refund
Wishlist
```

Ware 정보는 server/RPC 내부에서만 사용한다.

---

## Availability Boundary

Consumer는 실제 Ware 재고 구조를 조회하지 않는다.

서버/RPC는 내부 Ware 상태를 기반으로 Consumer-safe 상태만 반환한다.

예:

```text
AVAILABLE
LOW_STOCK
OUT_OF_STOCK
UNAVAILABLE
```

실제 stock quantity를 Consumer에게 노출하는 것은 기본 contract가 아니다.

---

## Commerce Structure

### Wishlist

Wishlist는 ProductPost 기준이다.

```text
Wishlist
→ ProductPost
```

---

### Cart

Cart는 Product + ProductVariant 기준이다.

```text
Cart
  ↓
CartItem
  ├─ productId
  ├─ productVariantId
  └─ quantity
```

Ware는 Cart contract에 포함되지 않는다.

---

### Order

Order는 Product + ProductVariant를 기준으로 생성된다.

```text
Order
  ↓
OrderItem
  ├─ Product
  ├─ ProductVariant
  └─ immutable snapshot
```

OrderItem은 주문 당시 정보를 snapshot으로 저장한다.

예:

```text
productName
variantLabel
selected options
unitPrice
quantity
image
```

현재 Product/ProductVariant가 나중에 변경되어도 OrderItem snapshot은 변경하지 않는다.

---

## Internal Order Stock Allocation

주문 시 실제 Ware 차감 내역은 내부적으로:

```text
order_item_ware_allocations
```

에 기록한다.

이 정보는 다음 용도로만 사용한다.

```text
정확한 stock deduction 기록
Order cancel 시 정확한 Ware 복구
internal warehouse audit
```

Consumer에게는 절대 노출하지 않는다.

---

## History

History는 독립 Product 관계를 만들지 않는다.

```text
History
→ Order
→ OrderItem snapshot
```

과거 주문 화면은 현재 Product가 아니라 OrderItem snapshot을 기준으로 표시한다.

---

## Refund

Refund는 Order / OrderItem 기준이다.

```text
Refund
→ Order
→ OrderItem
```

Refund 생성만으로 Ware 재고를 자동 복구하지 않는다.

실제 반품 검수 후 Ware 재입고가 필요하면 Warehouse domain RPC를 통해 처리한다.

---

## Data Access Boundaries

Mall v2에서 application data access는 목적에 따라 다음 중 하나를 사용한다.

### Direct Supabase + RLS

단순하고 안전한 Consumer read 또는 사용자 소유 데이터에 사용한다.

예:

```text
published ProductPost read
active Product read
Wishlist read
own Order read
```

RLS가 접근 경계를 보장한다.

---

### Supabase RPC

transaction, consistency, internal stock 정보가 필요한 작업에 사용한다.

예:

```text
Product detail availability
Cart operation
Order creation
Order cancellation
Refund request
Ware stock mutation
Warehouse/Ware management
ProductVariant ↔ Ware management
```

DB transaction이 필요한 로직을 client code에 복제하지 않는다.

---

### Next Route Handler

다음 경우에 사용한다.

```text
server-only secret 사용
service_role 필요
여러 RPC/API orchestration
application-specific server boundary 필요
external service integration
```

단순히 legacy Express endpoint를 대체하기 위해 Route Handler를 만들지는 않는다.

---

## Admin Boundary

`apps/user-web`은 현재 Admin application이다.

Admin의 privileged operation은 browser에서 service-role credential을 사용하지 않는다.

흐름은 필요에 따라:

```text
Admin browser
→ Next server boundary
→ Supabase service_role / RPC
```

를 사용한다.

특히 다음은 trusted server context에서 처리한다.

```text
Warehouse/Ware 관리
stock mutation
Variant ↔ Ware 연결
Admin order mutation
Refund processing
internal warehouse inspection
```

---

## RLS

Mall v2는 처음부터 RLS를 적용한다.

Consumer에게 직접 허용되는 data와 내부 data를 구분한다.

Consumer direct access가 금지되는 대표 영역:

```text
warehouses
wares
product_variant_wares
order_item_ware_allocations
```

Admin/service operations는 server-side privileged client 또는 service-role 기반 RPC를 사용한다.

---

## Environment Boundary

Browser-safe Supabase variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Server-only Supabase credentials:

```text
SUPABASE_SECRET_KEY
```

`SUPABASE_SECRET_KEY`는 Mall v2의 canonical privileged credential 이름이다. 값은 Supabase secret key(`sb_secret_...`)이며, legacy `service_role` JWT도 동일하게 동작한다. `SUPABASE_SERVICE_ROLE_KEY` 등 다른 이름은 사용하지 않는다.

`apps/user-web`에서는 `lib/supabase/admin.ts`의 `requireAdminServiceClient()`만 이 값을 읽으며, 모든 Admin Route Handler는 이 helper를 통해서만 privileged client를 만든다. Supabase URL은 browser-safe 값이므로 이 helper도 `NEXT_PUBLIC_SUPABASE_URL`을 사용한다.

프로젝트에서 추가 server secret naming을 사용하는 경우에도 동일한 원칙을 적용한다.

다음은 금지한다.

```text
NEXT_PUBLIC_*에 service-role/secret credential 저장
browser bundle에서 privileged Supabase client 생성
secret 값을 log/document/commit에 출력
```

---

## Legacy Express API

기존 구조:

```text
Next.js clients
    ↓ HTTP
Express API
    ↓
Supabase
```

는 Mall v2의 기본 architecture가 아니다.

Legacy API reference가 발견되면 각 flow를 다음 중 하나로 재분류한다.

```text
Direct Supabase + RLS
Supabase RPC
Next Route Handler
Remove as legacy
```

`apps/api`를 단순 호환성 목적으로 복원하지 않는다.

---

## Legacy Inventory Migration

다음 개념은 Mall v2 신규 기준이 아니다.

```text
SkuInventory
inventoryId
inventory_items
Product -> Inventory 직접 연결
Product-only Cart identity
Inventory-based OrderItem snapshot
```

신규 구조는 다음으로 전환한다.

```text
Product
→ ProductVariant
→ ProductVariantWare
→ Ware
→ Warehouse
```

Repository migration 중 legacy code를 발견하더라도 새 설계를 legacy model에 맞춰 되돌리지 않는다.

---

## Shared Type Direction

`packages/types`는 application 간 공유 contract를 정의한다.

Mall v2 주요 타입은 다음 방향으로 정리한다.

```text
ProductPost
Product
ProductOption
ProductOptionValue
ProductVariant
Warehouse
Ware
Cart
CartItem
Order
OrderItem
Refund
Wishlist
```

Consumer type에는 내부 Warehouse allocation 정보가 포함되면 안 된다.

Admin type에서는 필요한 Warehouse/Ware 정보만 별도 contract로 제공한다.

---

## Validation Strategy

Validation은 변경 범위에 맞게 단계적으로 수행한다.

일반 implementation 중 기본적으로:

```text
targeted typecheck
affected package build
targeted lint/test
```

를 사용한다.

Mall v2 migration 완료 후에는 별도 End-to-End verification phase에서 전체 주요 flow를 검증한다.

대표 flow:

```text
Product 생성
→ ProductOption/Value 생성
→ ProductVariant 생성
→ Ware 생성/연결
→ ProductPost 연결
→ Consumer Product 조회
→ Variant 선택
→ Cart
→ Order
→ Ware stock 차감
→ History
→ Cancel / Refund
→ stock/history 검증
```

---

## Deployment

각 Next application은 자체 build/deployment boundary를 가진다.

현재 Mall v2 architecture는 별도의 Express runtime을 필수로 요구하지 않는다.

Next application deployment와 Supabase는 독립적으로 운영할 수 있다.

Vercel 등 실제 배포 설정은 각 application/project 설정을 따른다.

배포 환경에서도 다음 원칙을 유지한다.

```text
browser-safe env와 server secret 분리
service-role credential은 server-only
production Supabase project env 사용
RLS 유지
```

---

## 현재 Migration Direction

현재 Mall v2 migration의 기본 방향은 다음과 같다.

```text
1. Supabase v2 schema / RPC / RLS 확정
2. Shared types migration
3. Shared constants migration
4. Supabase helpers 정리
5. Admin Product / Option / Variant migration
6. Admin Warehouse / Ware migration
7. ProductPost integration
8. Consumer ProductVariant selection
9. Cart migration
10. Order migration
11. History / Refund migration
12. Admin Overview migration
13. Legacy Inventory/SkuInventory 제거
14. Documentation 정리
15. Targeted build/typecheck/test
16. End-to-End verification
```

새 implementation은 이 방향과 확정된 Mall v2 SQL/domain contract를 기준으로 한다.
