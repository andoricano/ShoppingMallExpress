# Vercel frontend deployment

## Current client-pwa setup

`apps/client-pwa` is linked to the existing Vercel project `andoricano/shopping-mall-express-client-pwa` and uses Vercel's Git integration. Pushes to the repository trigger Vercel deployments; do not add a direct `vercel --prod` deployment workflow.

The production and preview environments use these variable names:

- `API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Values are managed in Vercel and must not be committed. `turbo.json` declares these names in `globalEnv` so a root-level `turbo run build` passes them through to the Next.js build task and includes them in Turborepo's environment handling. `.vercel` is ignored and its local link data must remain untracked.

`API_URL` is read while Next.js builds the `/api/*` rewrite; the two `NEXT_PUBLIC_*` values are embedded in client-side code at build time. Add or change any of these values in the target Vercel environment, then redeploy that environment. Production builds fail when `API_URL` is absent instead of deploying a rewrite to localhost.

## Additional frontend projects

`client-web` and `user-web` can each be connected to a separate Vercel project using this same Git repository. For each project:

1. Set the Vercel project root directory to its app workspace (for example, `apps/client-web`).
2. Configure that app's required environment variables in Vercel; do not copy values into repository files.
3. Keep Git integration enabled so commits and pull requests produce the normal production/preview deployments.

`apps/user-web` (Admin) reads these variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` — server-only Supabase secret key used by Admin Route Handlers. Never prefix it with `NEXT_PUBLIC_`.

`apps/client-web` (Consumer) reads these variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` — server-only; used by the payment Route Handlers for the service-role payment RPCs.
- `PG_TEST_ENDPOINT_URL` — server-only PG Test recorder endpoint.
- `PG_TEST_API_KEY` — server-only; sent as `X-PG-Test-Key`. Never prefix it with `NEXT_PUBLIC_`.

Only `apps/client-pwa`'s Vercel link and environment-variable names are confirmed here. Before linking another app, verify its deployment-time environment-variable requirements from its own configuration.
