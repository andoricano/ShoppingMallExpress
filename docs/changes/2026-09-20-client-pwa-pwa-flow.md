# Client PWA shopping flow

Commit reviewed: `9db76d1 feat(client-pwa): add shopping PWA flow`

## Goal

Replace the initial inventory debug screen in `apps/client-pwa` with a customer-facing PWA that supports Google login, product discovery, cart operations, test-order creation and lookup, installation, and a basic offline notice. The implementation is intentionally limited to the existing client API and Supabase contracts; it does not add payment approval.

## Changed areas

| Area | Files | Purpose |
| --- | --- | --- |
| PWA page and styling | `apps/client-pwa/app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Customer shopping UI, session state, cart/order UI, PWA metadata, and styles. |
| API and auth adapters | `apps/client-pwa/lib/api.ts`, `lib/auth.ts`, `app/auth/callback/route.ts` | Existing API endpoint access, browser Supabase client, and OAuth code exchange. |
| PWA delivery | `app/manifest.ts`, `app/components/InstallControl.tsx`, `public/sw.js`, `public/offline.html`, `public/icon-192.png` | Manifest, install prompt, service worker, offline fallback, and icon. |
| Configuration | `.env.example`, `.gitignore`, `next.config.ts`, `package.json`, `pnpm-lock.yaml` | API rewrite, public Supabase configuration, cache headers, and existing workspace dependency declarations. |

## Implementation

- The page uses `@mall/mall-page-viewer`'s `ProductCard`, `@mall/types`, and `@mall/constants` rather than introducing a second product model or endpoint map.
- `lib/api.ts` calls the existing public product-post endpoints and the existing cart/order endpoints. Authenticated requests attach the Supabase access token and use `cache: "no-store"`.
- Google OAuth starts from the browser Supabase client. The callback route exchanges the returned code, writes the session cookies to the redirect response, and redirects to the PWA root.
- The test-order form sends the logged-in user ID, generated `test-<uuid>` payment ID, cart product IDs/quantities, address, and zero point amount to the existing create-order endpoint. On a successful response it reads the returned order through the existing detail endpoint.
- The PWA manifest uses standalone display and the supplied 192/512 icons. `InstallControl` registers `sw.js` in production and exposes the browser-provided install prompt when available.
- The service worker caches only the offline document and icons. It does not intercept API, OAuth, authenticated, or non-GET requests. Failed navigations fall back to `offline.html`.

## Static verification

This review was source-only. No test, typecheck, lint, build, server, or browser command was run.

- `shopApi` uses `API_ENDPOINTS.CLIENT_PRODUCT_POSTS`, `CLIENT_CART`, and `CLIENT_ORDERS`; these resolve to `/api/product-posts`, `/api/client/cart`, and `/api/client/orders` in `packages/constants/src/api.ts`.
- The PWA cart calls match the existing cart router: GET/POST `/api/client/cart` and DELETE `/api/client/cart/:productId`.
- The PWA test-order payload includes the fields required by the existing create-order controller: `clientId`, `paymentId`, non-empty `items`, `shippingAddress`, and integer `pointAmount` of `0`.
- The order display consumes the existing `Order` and `OrderItem` fields from `@mall/types`; product list cards consume `ProductPost.thumbnail`.
- `next.config.ts` routes same-origin `/api/*` calls to `API_URL` (default `http://localhost:8080`) and marks API, auth, and service-worker responses as non-cacheable where configured.
- The service worker's explicit exclusions keep API, auth, authorized, and write requests out of its cache path. This is a code-path review only.

## Not verified

- Dependency resolution, TypeScript types, lint rules, production compilation, and generated manifest output.
- Supabase OAuth provider configuration, redirect allow-list, cookie exchange, session refresh, or logout behavior against a real project.
- API reachability, CORS behavior, product/cart/order response shapes, database RPC behavior, inventory effects, or authorization behavior.
- Browser install prompt availability, service-worker registration, cache behavior, offline fallback, mobile layout, and iOS installation behavior.

## Manual validation

Use a disposable/test Supabase project and test data. Test-order creation may create persistent order data and affect inventory through the existing API/RPC.

1. Install workspace dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Create PWA configuration and set the real test values:

   ```bash
   cp apps/client-pwa/.env.example apps/client-pwa/.env.local
   ```

   Set `API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. In Supabase, allow `http://localhost:3003/auth/callback` as an OAuth redirect URL.

3. Configure the existing API's environment for the same test project, then start it in one terminal:

   ```bash
   pnpm --filter @mall/api dev
   ```

4. From a second terminal, run the PWA's static checks and production build if desired:

   ```bash
   pnpm --filter @mall/client-pwa exec tsc --noEmit
   pnpm --filter @mall/client-pwa lint
   pnpm --filter @mall/client-pwa build
   ```

5. Start the production PWA on port 3003 so production-only service-worker registration is exercised:

   ```bash
   pnpm --filter @mall/client-pwa start -- --port 3003
   ```

6. Open `http://localhost:3003` and verify in this order:

   1. Product list loads, search filters titles, and a product detail exposes purchasable options.
   2. Google login completes and returns to the root. Confirm the UI changes to logout.
   3. Add an option to the cart, open the cart, then remove it and confirm the server-backed cart reflects the change.
   4. Add an option again, enter a test address, create one test order, and record the returned order ID. Confirm the order view shows the returned status, items, and address.
   5. Refresh while signed in and confirm the cart and order lookup still use the correct account.
   6. In a Chromium browser, inspect the manifest and install the app. Reopen the installed app and verify the standalone launch behavior.
   7. After a successful online load, disable the network and navigate or reload. Confirm the offline notice appears; confirm cart/order writes are unavailable offline.

## Known risks

- The existing create-order controller trusts `clientId` from the request body and does not verify the Bearer token in that handler. The PWA sends the current Supabase session user ID, but API-side identity enforcement remains an existing backend concern outside this PWA-only change.
- A duplicate or ambiguous request failure can leave a test order created server-side before the client receives a response. The UI blocks a second submission within the mounted form and directs the user to order lookup/admin confirmation, but it cannot make the existing endpoint idempotent.
- The implementation has no real payment approval. Its generated payment ID is explicitly a test identifier.
- Installation behavior depends on browser support and serving over a secure context outside localhost. iOS uses its own home-screen flow.
- The service worker deliberately does not cache live catalog, auth, cart, or order data. Offline behavior is limited to the fallback document and cached icons.
