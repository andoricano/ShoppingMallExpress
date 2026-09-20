# Architecture

## 개요

이 저장소는 pnpm 9 workspace와 Turborepo 2 기반 monorepo다. workspace 범위는 `apps/*`와 `packages/*`이며, 루트 Node.js 요구 버전은 18 이상이다. Turborepo는 build, lint, check-types, dev task를 조정한다.

## Applications

| Workspace | 역할 |
| --- | --- |
| `apps/api` | Express 5 API 서버. entry point는 `src/index.ts`이며 `@mall/types`, `@mall/constants`, Supabase SDK를 사용한다. |
| `apps/client-pwa` | Next.js 고객 PWA. `/api/*`를 `API_URL`(기본 `http://localhost:8080`)로 rewrite하며 service worker 관련 응답 헤더를 둔다. |
| `apps/client-web` | Next.js 고객 웹. 장바구니, 관심상품, 마이페이지 및 주문 관련 route가 확인된다. |
| `apps/develop-web` | Next.js 개발용 웹 app. `/api/*`를 로컬 Express API(`http://localhost:8080`)로 rewrite한다. |
| `apps/user-web` | Next.js 웹 app. 관리자 로그인, 재고, 주문, 사용자, 게시물, 환불 route가 확인된다. `/api/*` rewrite의 대상은 `NEXT_PUBLIC_API_URL` 또는 로컬 API다. |

## Shared packages

| Workspace | 역할 |
| --- | --- |
| `packages/types` | API request/response와 도메인 공유 타입의 공개 source (`src/index.ts`). Client와 API 모두 이 패키지를 사용한다. |
| `packages/constants` | 공유 상수의 공개 source (`src/index.ts`). |
| `packages/mall-page-viewer` | React peer dependency를 갖는 페이지 뷰어 package. client-pwa, client-web, user-web이 사용한다. |
| `packages/category-tree` | React peer dependency를 갖는 카테고리 트리 package. user-web이 사용한다. |
| `packages/tiptap` | Tiptap/React 기반 editor 관련 package. client-web과 user-web이 사용한다. |
| `packages/eslint-config`, `packages/typescript-config` | 공유 lint/TypeScript 설정 package. |

## 경계와 의존 방향

```text
Next.js clients ──HTTP /api──> Express API ──> Supabase
       │                            │
       └────> @mall/types/constants <┘
```

- Client app은 API의 내부 controller/service가 아니라 `docs/api/README.md`와 `@mall/types`를 계약 기준으로 사용한다.
- API가 public contract를 변경하면 `packages/types`와 `docs/api/README.md`를 함께 갱신한다. 해당 타입을 사용하는 client도 함께 검토한다.
- API 내부 구현·DB schema는 이 문서의 경계 밖이다.

## 배포·연결

- `Dockerfile.api`는 Node 22 기반으로 전체 workspace를 설치하고 `pnpm --filter api build` 후 API를 포트 8080에서 실행한다.
- 각 Next app은 자체 `next build` script를 제공한다. `client-pwa`와 `user-web`은 환경 변수로 API rewrite 대상을 바꿀 수 있다.
- Supabase는 API와 모든 Next client manifest에 SDK 의존성으로 존재한다. RLS, 프로젝트 설정, DB schema는 이 범위에서 확인하지 않았다.
- Vercel 또는 Cloud Run의 배포 선언 파일은 확인하지 못했다. 따라서 Next app이 Vercel에, API container가 Cloud Run에 실제 배포되는지와 환경 변수 설정은 이 문서만으로 확정할 수 없다.

## Client 작업 지침

- 접근: 대상 `apps/<client>`, `packages/types`, `docs/api/README.md`, 필요한 shared UI package.
- 피함: client 작업 중 `apps/api` 내부 구현 분석·수정. 계약이 부족하거나 모호하면 API 문서/타입의 갱신 필요성을 기록한다.

## 현재 주의사항

- 관리자 카테고리 router의 legacy `/api` aliases는 유지되지만 deprecated다. 명시적 `/api/admin/product-post-categories` 경로를 사용한다. legacy router는 명시적 `/api` route 뒤에 등록되어 경로 가로채기를 피한다.
- 관심상품 삭제 route의 path parameter 이름은 `productId`지만 실제 의미는 product post id다. API 문서에서 deprecated로 표시되어 있으며 다음 major API version의 변경 대상으로 기록돼 있다.
- API 인증은 endpoint별 계약을 따른다. 모든 API가 동일한 인증 정책을 사용한다는 근거는 확인하지 않았다.
