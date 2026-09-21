# Mall 공개 API 계약

`apps/api/src/index.ts`의 실제 라우트 마운트와 각 연결 controller를 기준으로 작성한 클라이언트용 계약이다. 모든 응답은 JSON이며, 성공 응답은 `{ "success": true, "data": ... }`(데이터가 없는 경우 `data` 생략 가능), 오류 응답은 `{ "success": false, "message": string, "error"?: string }` 형식이다. DB snake_case 필드는 응답에서 camelCase로 변환된다.

## 공통

- **인증**: `Bearer access-token`은 `Authorization: Bearer <token>` 헤더를 뜻한다. `없음`은 현재 controller에 서버 측 인증 검사가 없음을 뜻한다.
- **공통 오류**: 각 endpoint에서 별도로 적지 않은 서버/저장소 오류는 `500`이다. `401`은 인증 필요 endpoint에서 토큰이 없거나 유효한 사용자를 확인하지 못했을 때 발생한다.
- **식별자와 날짜**: 모든 `id`는 `string`, 날짜는 ISO 8601 `string`이다.
- **관련 타입**: 아래 타입은 `@mall/types` (`packages/types`) export다. 실제 응답이 타입과 정확히 같지 않은 경우 endpoint의 응답 설명을 우선한다.

| 타입 | 주요 용도 |
| --- | --- |
| `SkuInventory`, `CreateInventoryInput` | 재고 항목 및 생성 요청 |
| `Product`, `ProductPost`, `ThumbnailInfo` | 상품/상품 게시물 |
| `ProductPostCategory`, `ClientCategory`, `ProductPostCategoryItem` | 카테고리와 카테고리 게시물 요약 |
| `Order`, `OrderItem`, `OrderStatus`, `OrderShippingAddress`, `OrderShippingAddressInput`, `OrderDelivery` | 주문 |
| `UserProfile`, `UserRole` | 회원 관리 |
| `Cart`, `CartItem`, `CartEntry`, `Wishlist`, `WishlistEntry` | 장바구니/관심상품 |
| `Point`, `PointTransaction`, `PointReservation` | 포인트 |
| `RefundRequest`, `RefundStatus` | 환불 |
| `History`, `ClientHistoryItem` | 이력 |
| `ClientPageConfig` | 페이지 설정에서 사용할 수 있는 구성 값 |
| `AdminDashboardOverview`, `AdminDashboardInventoryAlert` | 관리자 Dashboard overview |

## 상태 확인과 페이지 설정

### `GET /`

- **Auth**: 없음
- **Params/query/body**: 없음
- **Success**: `200 { success: true, message: "ShoppingEx API Server is running!", status: "success" }`
- **주요 오류**: controller가 별도 오류를 반환하지 않는다.
- **관련 타입**: 없음
- **Notes**: 헬스 체크 endpoint다.

### `GET /api/page-config/:key`

- **Auth**: 없음
- **Params/query/body**: path `key` (필수)
- **Success**: `200`, `data`는 저장된 임의 JSON 값 또는 설정이 없을 때 `null`
- **주요 오류**: `400` 빈 `key`
- **관련 타입**: 값이 메인 페이지 설정이면 `ClientPageConfig`
- **Notes**: key별 스키마 검증은 하지 않는다.

### `PUT /api/page-config/:key`

- **Auth**: 없음
- **Params/query/body**: path `key` (필수), body 전체를 설정 값으로 저장
- **Success**: `200`, `data`는 저장된 body 값
- **주요 오류**: `400` 빈 `key`
- **관련 타입**: 값이 메인 페이지 설정이면 `ClientPageConfig`
- **Notes**: 같은 key는 upsert로 덮어쓴다.

## 관리자 Dashboard Overview

### `GET /api/admin/overview`

- **Auth**: `Bearer access-token` 필요. Supabase 사용자 확인 후 공식 `ADMIN` role만 허용한다.
- **Params/query/body**: 없음
- **Success**: `200 { success: true, data: AdminDashboardOverview }`
- **주요 오류**: `401` 토큰 없음/유효하지 않음, `403` 관리자가 아님, 공통 `500`
- **관련 타입**: `AdminDashboardOverview`, `AdminDashboardInventoryAlert`
- **Notes**:
  - `generatedAt`은 UTC ISO 8601 시각이다.
  - 오늘 집계는 `Asia/Seoul` 날짜 경계로 계산한다.
  - `todayOrders.totalAmount`는 오늘 생성된 주문의 `totalPrice` 합계이며 결제 매출이 아니다.
  - `orders.pendingFulfillmentCount`는 `PENDING` 주문 수다.
  - `refunds.requestedCount`는 `REQUESTED` 환불 요청 수다.
  - 재고 부족 기준은 controller의 `LOW_STOCK_THRESHOLD = 5`이며, 품절은 `currentStock === 0`, 재고 부족은 `0 < currentStock <= 5`다. `alerts`는 두 조건에 해당하는 SKU의 최소 정보만 담는다.
  - `pageConfig.isConfigured`는 `main_page` key가 저장되어 있는지 여부다.
  - `productPosts`는 전체와 공개(`isPublished`) 게시물 수만 제공한다.

## 관리자 재고

이 섹션의 모든 endpoint는 `Bearer access-token`과 공식 `ADMIN` role이 필요하다. 인증 정보가 없거나 유효하지 않으면 `401`, 인증됐지만 관리자가 아니면 `403`을 반환한다.

### `GET /api/inventory-items`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: query `search?: string`(SKU 부분 검색), `isActive?: "true" | "false"`; body 없음
- **Success**: `200`, `data: SkuInventory[]`
- **주요 오류**: 공통 `500`
- **관련 타입**: `SkuInventory`
- **Notes**: 생성일 내림차순이다.

### `POST /api/inventory-items`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: body `CreateInventoryInput` (`{ skuCode: string, currentStock?: number, isActive?: boolean, meta?: Record<string, unknown> }`); 기본값은 `0`, `true`
- **Success**: `201`, `data: SkuInventory`
- **주요 오류**: `400` `skuCode` 누락, `currentStock`이 0 이상 정수가 아님
- **관련 타입**: `CreateInventoryInput`, `SkuInventory`
- **Notes**: `meta` 미지정 시 `null`로 저장된다.

### `PATCH /api/inventory-items/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body `{ skuCode?: string, isActive?: boolean, meta?: Record<string, unknown> }`
- **Success**: `200`, `data: SkuInventory`
- **주요 오류**: `400` 빈 `skuCode` 또는 변경할 필드 없음
- **관련 타입**: `SkuInventory`
- **Notes**: `currentStock`은 이 endpoint로 변경할 수 없다.

### `PATCH /api/inventory-items/:id/stock`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body `{ adjustmentQty: number }`
- **Success**: `200`, `data`는 재고 조정 RPC 반환값
- **주요 오류**: `400` id 누락 또는 `adjustmentQty`가 0이 아닌 정수가 아님
- **관련 타입**: `SkuInventory` (RPC 반환 형식은 별도 타입 미정의)
- **Notes**: 증감 수량을 전달한다.

### `PATCH /api/inventory-items/:id/status`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, `data: SkuInventory`
- **주요 오류**: `404` 재고 없음
- **관련 타입**: `SkuInventory`
- **Notes**: 현재 `isActive`를 반전한다. 비활성화 시 연결된 상품도 비활성화될 수 있다.

### `DELETE /api/inventory-items/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body 없음
- **Success**: `200 { success: true, message: "재고가 삭제되었습니다." }`
- **주요 오류**: `404` 재고 없음, `400` 활성 재고, `409` 연결 상품 존재
- **관련 타입**: `SkuInventory`
- **Notes**: 비활성이고 상품에 연결되지 않은 재고만 삭제할 수 있다.

## 관리자 상품 게시물

상품 게시물의 `thumbnail`은 `ThumbnailInfo`; 상품 입력은 `{ id?: string, name, mainImageUrl, imageUrls?, description?, price, inventoryId, displayOrder? }`이다. 상세/표시 응답의 게시물에는 `productPostProducts`가 포함되며 각 관계는 `id`, `productId`, `displayOrder`, 그리고 상세 조회에서는 `products`와 그 `inventoryItems`를 포함한다.

이 섹션의 모든 endpoint는 `Bearer access-token`과 공식 `ADMIN` role이 필요하다. 인증 정보가 없거나 유효하지 않으면 `401`, 인증됐지만 관리자가 아니면 `403`을 반환한다.

### `GET /api/admin/product-posts`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: query `search?: string`, `isPublished?: "true" | "false"`; body 없음
- **Success**: `200`, `data: (ProductPost & { productPostProducts: { id: string; productId: string; displayOrder: number }[] })[]`
- **주요 오류**: 공통 `500`
- **관련 타입**: `ProductPost`, `Product`
- **Notes**: 생성일 내림차순이다.

### `GET /api/admin/product-posts/category/:categoryId`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `categoryId` (공백 불가); body 없음
- **Success**: `200`, 위 목록과 같은 게시물 배열
- **주요 오류**: `400` 빈 `categoryId`
- **관련 타입**: `ProductPost`
- **Notes**: 카테고리에 연결된 게시물만 반환한다.

### `GET /api/admin/product-posts/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, `data: ProductPost`와 `productPostProducts[]`; 각 관계의 `products`는 `Product`와 `inventoryItems: SkuInventory`를 포함한다.
- **주요 오류**: `404` 게시물 없음
- **관련 타입**: `ProductPost`, `Product`, `SkuInventory`
- **Notes**: 공개 상태와 무관하게 조회한다.

### `POST /api/admin/product-posts`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: body `{ title: string, thumbnail: ThumbnailInfo, imageUrls?: string[], content?: string, isPublished?: boolean, metadata?: Record<string, unknown>, products: ProductInput[] }`
- **Success**: `201`, `data`는 상품 게시물 생성 RPC 반환값
- **주요 오류**: `400` 빈 `title`
- **관련 타입**: `ProductPost`, `ThumbnailInfo`, `Product`
- **Notes**: `imageUrls`, `content`, `isPublished`, `metadata`, `products`는 각각 `[]`, `""`, `false`, `{}`, `[]`로 기본 처리된다. RPC 반환 구조는 별도 타입이 없다.

### `PATCH /api/admin/product-posts/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body는 POST와 같은 전체 `{ title, thumbnail, imageUrls?, content?, isPublished?, metadata?, products? }`
- **Success**: `200`, `data`는 상품 게시물 수정 RPC 반환값
- **주요 오류**: `400` 빈 `title`
- **관련 타입**: `ProductPost`, `ThumbnailInfo`, `Product`
- **Notes**: 부분 patch가 아니라 미전달 필드도 기본값으로 처리된다.

### `PATCH /api/admin/product-posts/:id/status`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body `{ isPublished: boolean }`
- **Success**: `200`, `data: ProductPost`
- **주요 오류**: `404` 게시물 없음
- **관련 타입**: `ProductPost`
- **Notes**: `true`면 서버 시각으로 `publishedAt`을 설정하고, `false`면 `null`로 설정한다.

### `DELETE /api/admin/product-posts/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body 없음
- **Success**: `200 { success: true, message: "상품 게시물이 삭제되었습니다." }`
- **주요 오류**: 공통 `500`
- **관련 타입**: `ProductPost`
- **Notes**: 존재하지 않는 id도 controller는 성공으로 응답할 수 있다.

## 관리자 카테고리

아래의 `/api/admin/product-post-categories`가 명시적 관리자 경로다. 동일 router가 `/api`에도 마운트되어 있어, **deprecated legacy 경로** `GET|POST /api/`, `PATCH|DELETE /api/:id`, `GET|POST /api/:categoryId/posts`, `DELETE /api/:categoryId/posts/:postId`도 실제로 노출된다. legacy router는 모든 명시적 `/api` route 뒤에 등록되어 충돌하지 않으며, 새 클라이언트는 관리자 경로를 사용해야 한다.

명시적 관리자 경로와 legacy aliases 모두 `Bearer access-token`과 공식 `ADMIN` role이 필요하다. 인증 정보가 없거나 유효하지 않으면 `401`, 인증됐지만 관리자가 아니면 `403`을 반환한다.

### `GET /api/admin/product-post-categories`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: 없음
- **Success**: `200`, `data: ProductPostCategory[]`
- **주요 오류**: 공통 `500`
- **관련 타입**: `ProductPostCategory`
- **Notes**: `depth`, `displayOrder` 오름차순이며 비활성 카테고리도 포함한다.

### `POST /api/admin/product-post-categories`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: body `{ parentId?: string | null, name: string, slug: string, depth?: number, displayOrder?: number, isActive?: boolean }`
- **Success**: `201`, `data: ProductPostCategory`
- **주요 오류**: `400` 빈 `name`/`slug`, `depth`가 1–3 정수가 아님, 음수 `displayOrder`, 부모-깊이 관계 위반
- **관련 타입**: `ProductPostCategory`
- **Notes**: 기본값은 `parentId: null`, `depth: 1`, `displayOrder: 0`, `isActive: true`다.

### `PATCH /api/admin/product-post-categories/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body는 생성 필드 모두 선택값
- **Success**: `200`, `data: ProductPostCategory`
- **주요 오류**: `404` 카테고리 없음; `400` 빈 문자열, 값 범위/부모-깊이 관계/순환 참조 위반, 변경 필드 없음
- **관련 타입**: `ProductPostCategory`
- **Notes**: 최상위는 `parentId: null, depth: 1`; 최대 깊이는 3이다.

### `DELETE /api/admin/product-post-categories/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, `data: ProductPostCategory`
- **주요 오류**: `404` 카테고리 없음
- **관련 타입**: `ProductPostCategory`
- **Notes**: controller가 DB 삭제 결과를 그대로 반환한다.

### `POST /api/admin/product-post-categories/:categoryId/posts`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `categoryId`; body `{ postIds: string[] }`
- **Success**: `201`, `data`는 새로 생성된 관계 행 배열 (`productPostId`, `categoryId` 등)
- **주요 오류**: `400` 빈 `postIds` 또는 존재하지 않는 게시물 id 포함 (`data`에 invalid id 배열), `404` 카테고리 없음
- **관련 타입**: `ProductPostCategoryItem`, `ProductPost`
- **Notes**: 중복 id와 이미 존재하는 연결은 무시된다.

### `GET /api/admin/product-post-categories/:categoryId/posts`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `categoryId`; body 없음
- **Success**: `200`, `data: ProductPostCategoryItem[]` (`{ id, thumbnail }`)
- **주요 오류**: `404` 카테고리 없음
- **관련 타입**: `ProductPostCategoryItem`
- **Notes**: 빈 카테고리는 빈 배열이다.

### `DELETE /api/admin/product-post-categories/:categoryId/posts/:postId`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `categoryId`, `postId`; body 없음
- **Success**: `200`, `data`는 삭제한 관계 행
- **주요 오류**: `404` 관계 없음
- **관련 타입**: `ProductPostCategoryItem`
- **Notes**: 게시물이나 카테고리 자체의 존재 여부와 관계 없이 연결 행만 삭제한다.

## 관리자 주문·회원·환불·이미지

이 섹션의 모든 endpoint는 `Bearer access-token`과 공식 `ADMIN` role이 필요하다. 인증 정보가 없거나 유효하지 않으면 `401`, 인증됐지만 관리자가 아니면 `403`을 반환한다.

### `GET /api/orders`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: 없음
- **Success**: `200 data: Order[]` (items 없음)
- **주요 오류**: 공통 `500`
- **관련 타입**: `Order`
- **Notes**: 생성일 내림차순이다.

### `GET /api/orders/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, `data: Order` (`items: OrderItem[]` 포함)
- **주요 오류**: `400` 빈 id, `404` 주문 없음
- **관련 타입**: `Order`, `OrderItem`
- **Notes**: 주문 상세 route는 관리자 인증을 요구한다.

### `PATCH /api/orders/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body `{ status: "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED", delivery?: { carrier: string, trackingNumber: string, shippedAt?: string } }`
- **Success**: `200`, `data: Order` (items 없음)
- **주요 오류**: `400` id/status 누락 또는 `SHIPPING`인데 배송사·운송장번호 누락
- **관련 타입**: `Order`, `OrderStatus`, `OrderDelivery`
- **Notes**: `SHIPPING`이면 `shippedAt` 미지정 시 서버 시간이 사용된다.

### `GET /api/users`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: 없음
- **Success**: `200 data: UserProfile[]`
- **주요 오류**: 공통 `500`
- **관련 타입**: `UserProfile`, `UserRole`
- **Notes**: 생성일 내림차순이다.

### `PUT /api/users`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: body `{ users: UserProfile[] }`
- **Success**: `200`, `data: UserProfile[]`
- **주요 오류**: `400` `users`가 배열이 아님
- **관련 타입**: `UserProfile`, `UserRole`
- **Notes**: 전달한 각 사용자만 순차적으로 갱신한다. `CLIENT` 외 role은 client 전용 필드를 제거하고 `isOnboarded: false`로 저장한다.

### `DELETE /api/users`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: body `{ ids: string[] }`
- **Success**: `200`, `data: { id: string }[]`
- **주요 오류**: `400` 빈 배열 또는 `ids`가 배열이 아님
- **관련 타입**: `UserProfile`
- **Notes**: 삭제된 사용자 id만 반환한다.

### `GET /api/admin/refunds`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: 없음
- **Success**: `200`, `data: RefundRequest[]`. 각 항목의 `order`에는 `items`가 포함되며 `null`일 수 있다.
- **주요 오류**: 공통 `500`
- **관련 타입**: `RefundRequest`, `RefundStatus`, `Order`
- **Notes**: 환불 생성일 내림차순이다.

### `PATCH /api/admin/refunds/:id`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: path `id`; body `{ status: "APPROVED" | "REJECTED" }`
- **Success**: `200`, `data`는 환불 처리 RPC 반환값
- **주요 오류**: `400` id 누락 또는 허용되지 않은 status
- **관련 타입**: `RefundRequest`, `RefundStatus`
- **Notes**: `COMPLETED`는 직접 요청할 수 없다.

### `POST /api/images/upload-url`

- **Auth**: `Bearer access-token` 필요, `ADMIN` role
- **Params/query/body**: body `{ filename?: string, contentType: "image/jpeg" | "image/png" | "image/webp" }`
- **Success**: `200`, `data: { path: string, token: string, signedUrl: string }`
- **주요 오류**: `400` 지원하지 않는/누락된 `contentType`
- **관련 타입**: `ThumbnailInfo`의 `imageUrl`에 업로드 결과 URL을 사용할 수 있음
- **Notes**: `filename`은 현재 경로 생성에 사용되지 않는다. `signedUrl`로 업로드하는 별도 storage 요청은 이 API 계약 밖이다.

## 고객 공개 상품·카테고리

### `GET /api/product-posts`

- **Auth**: 없음
- **Params/query/body**: 없음
- **Success**: `200`, `data`는 공개된 `ProductPost[]`이며 `productPostProducts[].products`와 `inventoryItems`를 포함한다.
- **주요 오류**: 공통 `500`
- **관련 타입**: `ProductPost`, `Product`, `SkuInventory`
- **Notes**: 공개 게시물만 `publishedAt` 내림차순으로 반환한다.

### `GET /api/product-posts/:id`

- **Auth**: 없음
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, 위 목록의 게시물 한 건
- **주요 오류**: `404` 게시물이 없거나 비공개
- **관련 타입**: `ProductPost`, `Product`, `SkuInventory`
- **Notes**: 비공개 게시물은 존재해도 찾을 수 없음으로 처리한다.

### `GET /api/client/category`

- **Auth**: 없음
- **Params/query/body**: 없음
- **Success**: `200`, `data: ClientCategory[]`
- **주요 오류**: 공통 `500`
- **관련 타입**: `ClientCategory`
- **Notes**: 활성 카테고리만, `depth`·`displayOrder` 오름차순으로 반환한다.

### `GET /api/client/category/:categoryId/posts`

- **Auth**: 없음
- **Params/query/body**: path `categoryId` (공백 불가); body 없음
- **Success**: `200`, `data: ProductPostCategoryItem[]`
- **주요 오류**: `400` 빈 `categoryId`, `404` 없거나 비활성 카테고리
- **관련 타입**: `ProductPostCategoryItem`
- **Notes**: 연결된 게시물의 공개 상태는 여기서 필터링하지 않는다.

## 고객 주문·이력·환불

### `POST /api/client/orders`

- **Auth**: 없음
- **Params/query/body**: body `{ clientId: string, paymentId: string, items: { productId: string, quantity: number }[], shippingAddress: OrderShippingAddressInput, pointAmount: number }`
- **Success**: `201`, `data`는 주문 생성 RPC 반환값
- **주요 오류**: `400` `clientId`/`paymentId` 누락, 빈 `items`, 음수 또는 정수가 아닌 `pointAmount`
- **관련 타입**: `Order`, `OrderShippingAddress`, `OrderItem`
- **Notes**: 현재 이 endpoint는 Bearer token으로 `clientId`를 검증하지 않는다. `shippingAddress.name`은 생성·수정 모두 선택값이다.

### `GET /api/client/orders/:id`

- **Auth**: Bearer access-token
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, `data: Order` (`items` 포함)
- **주요 오류**: `401` 로그인 필요, `400` 빈 id, `404` 본인 주문 없음
- **관련 타입**: `Order`, `OrderItem`
- **Notes**: 인증 사용자 id와 일치하는 주문만 조회한다.

### `PATCH /api/client/orders/:id/cancel`

- **Auth**: Bearer access-token
- **Params/query/body**: path `id`; body 없음
- **Success**: `200`, `data`는 주문 취소 RPC 반환값
- **주요 오류**: `401` 로그인 필요, `400` 빈 id
- **관련 타입**: `Order`, `OrderStatus`
- **Notes**: 소유권 및 취소 가능 상태의 최종 판단은 RPC 결과에 따른다.

### `PATCH /api/client/orders/:id`

- **Auth**: Bearer access-token
- **Params/query/body**: path `id`; body `{ shippingAddress: OrderShippingAddressInput }`
- **Success**: `200`, `data`는 주문 수정 RPC 반환값
- **주요 오류**: `401` 로그인 필요, `400` 빈 id 또는 `shippingAddress` 누락
- **관련 타입**: `Order`, `OrderShippingAddress`
- **Notes**: 생성 요청과 같은 배송지 입력 shape을 사용한다.

### `GET /api/client/history`

- **Auth**: Bearer access-token
- **Params/query/body**: 없음
- **Success**: `200`, `data`는 이력 RPC 반환값 (통상 `ClientHistoryItem[]`)
- **주요 오류**: `401` 로그인 필요
- **관련 타입**: `ClientHistoryItem`, `History`
- **Notes**: token을 검증한 뒤 RPC 반환을 camelCase로 전달한다.

### `POST /api/client/refunds`

- **Auth**: Bearer access-token
- **Params/query/body**: body `{ orderId: string, reason?: string }`
- **Success**: `201`, `data`는 환불 생성 RPC 반환값
- **주요 오류**: `401` 로그인 필요, `400` `orderId` 누락
- **관련 타입**: `RefundRequest`, `RefundStatus`
- **Notes**: 주문 소유권과 환불 가능 여부의 최종 판단은 RPC 결과에 따른다.

## 고객 포인트·관심상품·장바구니

### `GET /api/client/points`

- **Auth**: Bearer access-token
- **Params/query/body**: 없음
- **Success**: `200`, `data: Point | null`
- **주요 오류**: `401` 로그인 필요
- **관련 타입**: `Point`
- **Notes**: 아직 포인트 행이 없으면 `null`이다.

### `GET /api/client/points/transactions`

- **Auth**: Bearer access-token
- **Params/query/body**: 없음
- **Success**: `200`, `data: PointTransaction[]`
- **주요 오류**: `401` 로그인 필요
- **관련 타입**: `PointTransaction`
- **Notes**: 생성일 내림차순이다.

### `POST /api/client/points/charge`

- **Auth**: Bearer access-token
- **Params/query/body**: body `{ amount: number }` (0보다 큰 정수)
- **Success**: `201`, `data`는 포인트 충전 RPC 반환값
- **주요 오류**: `401` 로그인 필요, `400` amount 범위 위반
- **관련 타입**: `Point`, `PointTransaction`
- **Notes**: 충전은 인증된 사용자에게 적용된다.

### `POST /api/client/payment/point/reserve`

- **Auth**: Bearer access-token
- **Params/query/body**: body `{ amount: number }` (0보다 큰 정수)
- **Success**: `201`, `data`는 포인트 예약 RPC 반환값
- **주요 오류**: `401` 로그인 필요, `400` amount 범위 위반
- **관련 타입**: `PointReservation`
- **Notes**: 예약 가능 잔액 등의 최종 판정은 RPC 결과에 따른다.

### `GET /api/client/wishlist`

- **Auth**: Bearer access-token
- **Params/query/body**: 없음
- **Success**: `200`, `data: WishlistEntry[]`
- **주요 오류**: `401` 로그인 필요
- **관련 타입**: `WishlistEntry`
- **Notes**: 생성일 내림차순이다.

### `POST /api/client/wishlist`

- **Auth**: Bearer access-token
- **Params/query/body**: body `{ productPostId: string }`
- **Success**: `201`, GET과 같은 관심상품 행 한 건
- **주요 오류**: `401` 로그인 필요, `400` `productPostId` 누락, `404` 게시물 없음, `409` 이미 등록됨
- **관련 타입**: `WishlistEntry`
- **Notes**: 게시물 공개 상태는 이 endpoint에서 확인하지 않는다.

### `DELETE /api/client/wishlist/:productId`

- **Auth**: Bearer access-token
- **Params/query/body**: path `productId` (실제로는 product post id); body 없음
- **Success**: `200 { success: true }`
- **주요 오류**: `401` 로그인 필요, `400` path 값 누락
- **관련 타입**: `Wishlist`
- **Notes**: route parameter 이름은 `productId`지만 `wishlists.product_post_id`와 비교한다. 이 이름은 deprecated이며 다음 major API version에서 `productPostId`로 변경해야 한다. 존재하지 않는 연결도 성공으로 응답할 수 있다.

### `GET /api/client/cart`

- **Auth**: Bearer access-token
- **Params/query/body**: 없음
- **Success**: `200`, `data: CartEntry[]` (`product` 포함)
- **주요 오류**: `401` 로그인 필요
- **관련 타입**: `CartEntry`
- **Notes**: 장바구니 행 배열 및 연결 상품을 반환한다.

### `POST /api/client/cart`

- **Auth**: Bearer access-token
- **Params/query/body**: body `{ productId: string, quantity: number }` (`quantity`는 0보다 큰 정수)
- **Success**: `201`, `data: CartEntry` (`product` 생략)
- **주요 오류**: `401` 로그인 필요, `400` productId 누락 또는 quantity 범위 위반
- **관련 타입**: `CartEntry`
- **Notes**: 같은 사용자·상품 조합은 upsert로 수량을 교체한다. 응답에는 `product`가 없다.

### `DELETE /api/client/cart/:productId`

- **Auth**: Bearer access-token
- **Params/query/body**: path `productId`; body 없음
- **Success**: `200 { success: true }`
- **주요 오류**: `401` 로그인 필요, `400` path 값 누락
- **관련 타입**: `CartEntry`
- **Notes**: 존재하지 않는 장바구니 행도 성공으로 응답할 수 있다.
