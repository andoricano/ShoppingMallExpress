## Product Domain Relationship Rules

### 1. Product

`Product`는 판매 상품의 중심 엔티티다.

Product는 다음 하위 구조를 가진다.

```text
Product
├─ ProductOption
│  └─ ProductOptionValue
│
└─ ProductVariant
```

Product 자체는 상품의 공통 정보를 가진다.

예:

* name
* description
* images
* 공통 상품 정보

실제 판매 가능한 조합과 가격은 `ProductVariant`가 담당한다.

---

## 2. ProductOption / ProductOptionValue

`ProductOption`은 Product의 선택 축을 정의한다.

예:

```text
Size
Color
ModelYear
Trim
Weight
```

`ProductOptionValue`는 각 Option의 실제 선택값이다.

예:

```text
Size
→ S
→ M
→ L

Color
→ Black
→ White

ModelYear
→ 2025
→ 2026
```

상품 종류마다 별도의 DB schema를 만들지 않고 동일한 Option 구조를 사용한다.

---

## 3. ProductVariant

`ProductVariant`는 실제 판매 가능한 단위다.

예:

```text
티셔츠

M + Black
M + White
L + Black
L + White
```

또는:

```text
아반떼

2026 + Modern
2026 + Inspiration
2025 + Modern
```

ProductVariant가 실제 판매 가격을 소유한다.

개념적으로:

```text
ProductVariant
- id
- productId
- price
- isActive
- option value combination
- optional meta
```

`meta`는 Option으로 모델링할 필요가 없는 부가 속성에만 사용한다.

---

## 4. Ware

`Ware`는 재고 관리 도메인의 독립 엔티티다.

Ware는 반드시 판매 상품일 필요가 없다.

예:

```text
판매 상품 재고
포장재
사은품
미판매 재고
원자재
기타 내부 보유품
```

따라서:

```text
Ware != Product
Ware != ProductVariant
```

이다.

판매 가능한 ProductVariant는 필요한 경우 Ware와 연결된다.

```text
ProductVariant
      ↓
     Ware
```

하지만 Ware 자체는 ProductVariant 없이도 존재할 수 있다.

---

## 5. Ware Consumer Exposure Rule

**Ware는 소비자에게 절대 직접 노출하지 않는다.**

Consumer API / Client에서는 다음을 노출하지 않는다.

```text
wareId
warehouseId
Ware record
Ware 내부 관리 정보
Ware 위치
Ware 관리 코드
```

Cart와 Order 역시 Ware를 직접 참조하지 않는다.

```text
금지:

Cart -> wareId
OrderItem -> wareId
Client -> Ware API
```

소비자는 오직:

```text
Product
ProductVariant
```

를 기준으로 상품을 선택하고 구매한다.

Ware는 서버/RPC 내부에서만 ProductVariant와 연결하여 재고 판단에 사용한다.

---

## 6. 재고 부족 / 품절 처리

Ware 수량 변화는 일반적인 쇼핑몰 UX 규칙으로 ProductVariant의 판매 가능 상태에 반영한다.

예:

```text
Ware stock > 0
→ 구매 가능

Ware stock <= 0
→ 품절

Ware stock이 설정된 부족 기준 이하
→ 재고 부족 표시 가능
```

Consumer에게 실제 Ware 구조를 노출하지 않고 필요한 판매 상태만 변환해서 제공한다.

예:

```ts
{
    variantId: "...",
    isAvailable: true
}
```

또는 필요할 경우:

```ts
{
    variantId: "...",
    stockStatus: "AVAILABLE"
}
```

```text
AVAILABLE
LOW_STOCK
OUT_OF_STOCK
```

실제 재고 숫자를 Consumer에게 공개할지는 별도의 UI 정책으로 결정한다.

Ware 자체의 존재나 Ware ID는 어떤 경우에도 Consumer 계약에 포함하지 않는다.

---

## 7. ProductPost

`ProductPost`는 Product를 소비자에게 표현하는 콘텐츠 엔티티다.

관계는:

```text
ProductPost : Product = N : N
```

이다.

```text
ProductPost
      ↕
ProductPostProduct
      ↕
Product
```

하나의 Product는 여러 ProductPost에서 노출될 수 있으며,
하나의 ProductPost도 여러 Product를 포함할 수 있다.

ProductPost는 Product의 생명주기나 Ware를 소유하지 않는다.

---

## 8. Wishlist

Wishlist는 Product가 아닌 `ProductPost` 중심이다.

```text
Wishlist
   ↓
ProductPost
```

따라서 사용자가 관심상품을 저장한다는 의미는:

```text
특정 ProductVariant 저장
```

이 아니라:

```text
특정 ProductPost 저장
```

이다.

Product / ProductVariant / Ware 구조 변경과 Wishlist는 직접 결합하지 않는다.

---

## 9. Cart

Cart는 Product 중심이지만 실제 구매 단위는 ProductVariant다.

```text
CartItem
├─ productId
├─ variantId
└─ quantity
```

즉 동일 Product의 서로 다른 Variant는 서로 다른 CartItem이다.

개념적 unique identity:

```text
clientId
+
productId
+
variantId
```

Cart는 Ware를 직접 참조하지 않는다.

재고 확인은 서버에서 `variantId`를 기준으로 연결된 Ware를 조회하여 처리한다.

---

## 10. Order

Order 역시 Product 중심이며 실제 거래 단위는 ProductVariant다.

```text
Order
  └─ OrderItem
       ├─ productId
       ├─ variantId
       ├─ quantity
       └─ snapshot
```

OrderItem은 Ware를 직접 소비자 계약으로 노출하지 않는다.

주문 생성 시 서버/RPC가:

```text
ProductVariant
→ Ware
→ 재고 확인
→ 재고 차감
```

을 내부적으로 처리한다.

---

## 11. Order Snapshot

OrderItem은 주문 당시 정보를 snapshot으로 저장한다.

Product나 ProductVariant가 이후 변경되어도 과거 주문 내용은 변하지 않아야 한다.

최소 snapshot 후보:

```text
productName
variant description / selected options
unitPrice
quantity
representative image
```

최종 필드는 Order 계약 확정 단계에서 결정한다.

---

## 12. HistoryItem

`HistoryItem`은 Product에 직접 연결되는 새로운 독립 도메인이 아니다.

History는 Order를 기반으로 한다.

```text
History
   ↓
Order
   ↓
OrderItem
   ↓
Product + ProductVariant snapshot
```

따라서 Product 관련 정보를 History에서 표시해야 할 경우 Order / OrderItem snapshot을 사용한다.

별도의 Product-Ware 관계를 History에 추가하지 않는다.

---

## 13. Refund

Refund 역시 Product에 직접 새 관계를 만들 필요가 없다.

```text
Refund
  ↓
Order
  ↓
OrderItem
```

환불 시 재고 복구가 필요하면 서버/RPC가 OrderItem의 Variant 정보를 기준으로 관련 Ware를 찾아 처리한다.

확정 정책: Refund `APPROVED`는 재고를 자동으로 바꾸지 않는다. 반품 확인 후 Admin이 승인된 refund item별로 명시적으로 restock하며, 복구는 해당 OrderItem이 원래 차감된 `order_item_ware_allocations`의 Ware 안에서만, 환불 수량과 allocation 수량을 넘지 않게 처리한다. 복구 기록(`refund_item_restocks`)과 `admin_restock_refund_item()`은 Admin/service-role 전용이며 Consumer에 노출하지 않는다.

Consumer-facing Refund 계약에 Ware를 노출하지 않는다.

---

## 14. Category

Category는 현재 Product 자체보다 ProductPost를 분류하는 콘텐츠 구조로 유지한다.

```text
Category
   ↕
ProductPost
   ↕
Product
```

따라서 Product Option / Variant / Ware와 직접 연결하지 않는다.

---

## 15. 전체 관계

```text
Category
   ↕
ProductPost
   ↕ N:N
Product
   ├─ ProductOption
   │    └─ ProductOptionValue
   │
   └─ ProductVariant
          │
          │ internal stock relation
          ▼
         Ware
          │
          ▼
      Warehouse
```

Commerce:

```text
Wishlist
   ↓
ProductPost


Cart
   ↓
Product
   ↓
ProductVariant


Order
   ↓
OrderItem
   ├─ Product
   ├─ ProductVariant
   └─ Snapshot


History
   ↓
Order


Refund
   ↓
Order
```

---

## 16. 핵심 경계

### Consumer Domain

Consumer가 알 수 있는 것:

```text
ProductPost
Product
ProductOption
ProductOptionValue
ProductVariant
가격
구매 가능 여부
품절 여부
```

### Internal Warehouse Domain

Consumer에게 숨겨지는 것:

```text
Warehouse
Ware
wareId
warehouseId
Ware 내부 메타데이터
재고 관리 정책
재고 이동
미판매 재고
내부 재고 관리 정보
```

두 영역의 경계는 서버/RPC가 담당한다.

Consumer는 ProductVariant를 구매한다.

서버는 ProductVariant에 연결된 Ware를 기준으로 실제 재고를 처리한다.
