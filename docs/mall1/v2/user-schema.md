# Mall v2 User Domain Contract

## Purpose

This document is the final pre-SQL contract for Mall v2 authentication identity,
application profiles, authorization, addresses, and consumer ownership. It does
not implement SQL, RLS policies, RPCs, Point behavior, or application code.

## Auth boundary

- Supabase Auth, including Google OAuth, owns authentication identity.
- `auth.users.id` is the canonical user UUID. Email and other authentication
  provider data remain owned by Supabase Auth. `user_profiles` does not store a
  duplicate email.
- A public `user_profiles` record has the same UUID as `auth.users` and forms a
  1:1 application-profile relationship.
- The first authenticated user receives a `user_profiles` record with the same
  UUID. The ordinary initial role is `CLIENT`.
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
- Admin creation and promotion are allowed only through a trusted
  server/database boundary. Consumer API and RLS paths cannot perform either
  operation, including initial Admin bootstrap.

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

Client addresses are separate from the profile in a 1:N relationship.
`client_addresses.client_id` references `user_profiles.id`; it is the same
canonical UUID as the authenticated user's `auth.users.id`.

```text
ClientAddress
  id, clientId, label, recipientName, phone,
  zonecode, address, addressDetail, isDefault,
  createdAt, updatedAt
```

`ClientAddress` is the shipping-address Source of Truth. The legacy embedded
`ClientProfile.address` shape is deprecated.

- A client has zero or more addresses and at most one default address.
- Setting `isDefault = true` clears any existing default address for that
  client as part of the same logical change.
- Creating the first address as the default is allowed.

## Onboarding boundary

Authentication identity and the initial `CLIENT` profile exist before
onboarding. `CreateUserInput` is an onboarding-orchestration input, not the
shape of one database row. The onboarding flow may configure profile data and
the first `ClientAddress` together. `isOnboarded` records the completed
application state; it does not replace session validation.

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

## Resolved contract and legacy compatibility notes

- The finalized Mall v2 SQL files currently do not define `user_profiles` or
  `client_addresses`; this document is a domain contract, not their SQL design.
- Existing Admin authentication code reads a legacy public `users` profile and
  role. It must align with the `user_profiles` contract.
- The existing `ClientProfile.address` object overlaps with `ClientAddress`.
  `ClientAddress` is canonical; the embedded shape is legacy/deprecated.
- The existing Cart type is Product-only and lacks `productVariantId`, which
  conflicts with the finalized Mall v2 Cart identity. This is recorded only;
  no Cart change is part of this document.
- The legacy History type includes an `INVENTORY` target. Mall v2 treats Ware as
  an internal inventory domain and derives consumer history from orders; the
  type is a legacy compatibility concern, not a User-domain rule.
- Point remains a separate domain. Its data model and behavior are unchanged by
  this contract.

## Remaining implementation work

There are no unresolved User-domain decisions in this document. The subsequent
SQL and migration work must implement this contract, including the 1:1 and 1:N
relations, default-address invariant, profile-creation mechanism, trusted Admin
promotion boundary, and matching RLS/RPC enforcement.
