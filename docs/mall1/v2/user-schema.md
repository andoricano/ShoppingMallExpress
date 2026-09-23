# Mall v2 User Domain Contract (Draft)

## Purpose

This document defines the Mall v2 User-domain boundary: authentication identity,
application profile, authorization, and consumer ownership. It does not define
SQL, RLS policies, RPCs, Point behavior, or application implementation.

## Auth boundary

- Supabase Auth, including Google OAuth, owns authentication identity.
- `auth.users.id` is the canonical user UUID. Email and other authentication
  provider data remain owned by Supabase Auth; the profile should not duplicate
  email without a separately approved need.
- A public `user_profiles` record has the same UUID as `auth.users` and forms a
  1:1 application-profile relationship.
- A profile is not an authentication identity and must not be used to replace
  Supabase Auth session validation.

## User profiles and roles

Shared profile fields are:

```text
BaseProfile
  id, name, role, createdAt, updatedAt
```

Roles are limited to `CLIENT` and `ADMIN`.

- New consumer users are `CLIENT` by default.
- `user_profiles` owns the application role and profile fields.
- A client must never be able to change its own role to `ADMIN`.
- Creating or promoting an Admin is a trusted operational action; its exact
  bootstrap and promotion process remains to be decided.

### Client profile

```text
ClientProfile extends BaseProfile
  role: CLIENT
  recipientName, phone, isOnboarded, point reference
```

The Point reference is only a cross-domain reference. Point remains an
independent domain and is not redesigned here.

### Admin profile

```text
AdminProfile extends BaseProfile
  role: ADMIN
  department
```

`apps/user-web` is an Admin application. Its access requires both a valid
Supabase Auth session and `user_profiles.role = ADMIN`. A client-side role check
is only a navigation aid; server, RLS, and RPC boundaries must enforce the same
authorization without exposing privileged credentials to the browser.

## ClientAddress

Client addresses are separate from the profile in a 1:N relationship. The
identity represented by `clientId` is the authenticated user's UUID.

```text
ClientAddress
  id, clientId, label, recipientName, phone,
  zonecode, address, addressDetail, isDefault,
  createdAt, updatedAt
```

`ClientAddress` is the intended Source of Truth for shipping addresses. The
legacy embedded `ClientProfile.address` shape duplicates that concern and should
be deprecated or migrated only after the address contract is finalized.

## Onboarding boundary

Authentication identity is created by Supabase Auth first. Client onboarding
then completes the application-profile information required by the approved
onboarding flow. Whether profile creation occurs immediately on Auth signup or
as an onboarding step, and which fields are mandatory before completion, remain
open decisions. `isOnboarded` records the resulting application state; it does
not replace session validation.

## Ownership and RLS principles

- Consumer ownership is derived from `auth.uid()`, never from an arbitrary
  caller-supplied `clientId`.
- Consumer reads and mutations must be scoped to rows owned by that identity.
- Trusted server or service-role operations are reserved for administrative or
  otherwise privileged workflows; service-role credentials never reach the
  browser.
- The finalized Mall v2 SQL already uses `auth.users` references and
  `auth.uid()` ownership boundaries for consumer commerce data. This document
  does not add or alter those policies.

## Related domain references

User profiles do not own the following domains; they only provide identity and
ownership references.

| Domain | User-domain relationship |
| --- | --- |
| Wishlist | A consumer-owned ProductPost wishlist; `clientId` identifies the authenticated owner. |
| Cart | A consumer-owned shopping state; `clientId` identifies the authenticated owner. Mall v2 requires Product + ProductVariant selection. |
| History | An audit/history concern with optional actor identity. Mall v2 order history is derived through Order and OrderItem snapshots. |
| Point | A separate balance and transaction domain referenced by the client identity. |

## Open decisions and legacy mismatches

- The finalized Mall v2 SQL files currently do not define `user_profiles` or
  `client_addresses`; this document is a domain contract, not their SQL design.
- Existing Admin authentication code reads a legacy public `users` profile and
  role. It must later align with the approved `user_profiles` contract.
- The existing `ClientProfile.address` object overlaps with `ClientAddress`.
  `ClientAddress` is the preferred shipping-address source, but migration and
  compatibility handling are still open.
- The existing Cart type is Product-only and lacks `productVariantId`, which
  conflicts with the finalized Mall v2 Cart identity. This is recorded only;
  no Cart change is part of this document.
- The legacy History type includes an `INVENTORY` target. Mall v2 treats Ware as
  an internal inventory domain and derives consumer history from orders; the
  compatibility decision remains open.
- Profile creation timing, Admin bootstrap/promotion, default-address rules,
  and any required profile-email duplication need explicit decisions before
  schema or implementation work begins.
