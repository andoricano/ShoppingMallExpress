-- ============================================================
-- Mall v2
-- 09_user_domain.sql
--
-- Purpose:
--   Add the finalized User domain after the core Mall v2 schema.
--
-- Apply after:
--   01_tables.sql through 08_seed.sql
--
-- Core rules:
--
--   - auth.users owns authentication identity and email.
--   - public.user_profiles is a 1:1 application profile.
--   - Every new authenticated user starts as CLIENT.
--   - ADMIN promotion is service_role only.
--   - client_addresses is the shipping-address Source of Truth.
--   - Consumer ownership is always derived from auth.uid().
--
-- Point is intentionally not changed here.
-- ============================================================

begin;


-- ============================================================
-- User Profiles
--
-- Email is intentionally absent. Supabase Auth remains the
-- Source of Truth for authentication-provider data.
-- ============================================================

create table public.user_profiles (
    id uuid primary key,

    name text,
    role text not null default 'CLIENT',

    recipient_name text,
    phone text,
    is_onboarded boolean not null default false,

    department text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


alter table public.user_profiles
    add constraint user_profiles_auth_user_fk
    foreign key (id)
    references auth.users (id)
    on delete cascade;

alter table public.user_profiles
    add constraint user_profiles_role_valid
    check (role in ('CLIENT', 'ADMIN'));

alter table public.user_profiles
    add constraint user_profiles_name_not_blank
    check (name is null or btrim(name) <> '');

alter table public.user_profiles
    add constraint user_profiles_recipient_name_not_blank
    check (recipient_name is null or btrim(recipient_name) <> '');

alter table public.user_profiles
    add constraint user_profiles_phone_not_blank
    check (phone is null or btrim(phone) <> '');


-- ============================================================
-- Client Addresses
--
-- client_id is the same UUID as auth.users.id through the
-- user_profiles 1:1 relationship.
-- ============================================================

create table public.client_addresses (
    id uuid primary key default gen_random_uuid(),

    client_id uuid not null,

    label text,
    recipient_name text not null,
    phone text not null,

    zonecode text not null,
    address text not null,
    address_detail text,

    is_default boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


alter table public.client_addresses
    add constraint client_addresses_client_profile_fk
    foreign key (client_id)
    references public.user_profiles (id)
    on delete cascade;

alter table public.client_addresses
    add constraint client_addresses_label_not_blank
    check (label is null or btrim(label) <> '');

alter table public.client_addresses
    add constraint client_addresses_recipient_name_not_blank
    check (btrim(recipient_name) <> '');

alter table public.client_addresses
    add constraint client_addresses_phone_not_blank
    check (btrim(phone) <> '');

alter table public.client_addresses
    add constraint client_addresses_zonecode_not_blank
    check (btrim(zonecode) <> '');

alter table public.client_addresses
    add constraint client_addresses_address_not_blank
    check (btrim(address) <> '');


create index client_addresses_client_created_idx
    on public.client_addresses (
        client_id,
        created_at desc
    );


-- Enforces the default-address invariant and supports lookup of
-- the default address for a Client.
create unique index client_addresses_one_default_uidx
    on public.client_addresses (client_id)
    where is_default = true;


-- ============================================================
-- RLS and Table Privileges
--
-- user_profiles allows only an owner read and an owner update of
-- non-privileged profile columns. In particular, authenticated
-- users receive no UPDATE privilege for role or department.
-- ============================================================

alter table public.user_profiles
    enable row level security;

alter table public.client_addresses
    enable row level security;


revoke all
on table public.user_profiles
from anon;

revoke insert, update, delete
on table public.user_profiles
from authenticated;

grant select
on table public.user_profiles
to authenticated;

grant update (
    name,
    recipient_name,
    phone,
    is_onboarded
)
on table public.user_profiles
to authenticated;


revoke all
on table public.client_addresses
from anon;

grant select, insert, update, delete
on table public.client_addresses
to authenticated;


create policy user_profiles_owner_select
on public.user_profiles
for select
to authenticated
using (
    id = auth.uid()
);


create policy user_profiles_owner_update
on public.user_profiles
for update
to authenticated
using (
    id = auth.uid()
)
with check (
    id = auth.uid()
);


create policy client_addresses_owner_select
on public.client_addresses
for select
to authenticated
using (
    client_id = auth.uid()
);


create policy client_addresses_owner_insert
on public.client_addresses
for insert
to authenticated
with check (
    client_id = auth.uid()
);


create policy client_addresses_owner_update
on public.client_addresses
for update
to authenticated
using (
    client_id = auth.uid()
)
with check (
    client_id = auth.uid()
);


create policy client_addresses_owner_delete
on public.client_addresses
for delete
to authenticated
using (
    client_id = auth.uid()
);


-- ============================================================
-- Profile Initialization
--
-- The trigger executes when Supabase Auth creates a user. It does
-- not copy email or provider metadata into the application profile.
-- ============================================================

create or replace function public.initialize_user_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    insert into public.user_profiles (
        id,
        role
    )
    values (
        new.id,
        'CLIENT'
    )
    on conflict (id) do nothing;

    return new;
end;
$$;


revoke all
on function public.initialize_user_profile()
from public;


create trigger auth_users_initialize_user_profile
after insert
on auth.users
for each row
execute function public.initialize_user_profile();


-- Supports authenticated users that existed before this migration
-- without allowing a caller to choose an ID or role. New users are
-- initialized by the auth.users trigger above.
create or replace function public.ensure_current_user_profile()
returns public.user_profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_user_id uuid;
    v_profile public.user_profiles;
begin
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Authentication required';
    end if;

    insert into public.user_profiles (
        id,
        role
    )
    values (
        v_user_id,
        'CLIENT'
    )
    on conflict (id) do nothing;

    select *
      into v_profile
    from public.user_profiles
    where id = v_user_id;

    return v_profile;
end;
$$;


revoke all
on function public.ensure_current_user_profile()
from public;

grant execute
on function public.ensure_current_user_profile()
to authenticated;


-- ============================================================
-- Generic updated_at Triggers
--
-- public.set_updated_at() is defined by 07_triggers.sql.
-- ============================================================

create trigger user_profiles_set_updated_at
before update
on public.user_profiles
for each row
execute function public.set_updated_at();


create trigger client_addresses_set_updated_at
before update
on public.client_addresses
for each row
execute function public.set_updated_at();


-- ============================================================
-- Default Address Handling
--
-- When a Client chooses a new default, clear the prior default
-- before the partial unique index is checked. A first address may
-- be created as the default. No default address is required.
-- ============================================================

create or replace function public.clear_previous_default_client_address()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    if new.is_default then
        update public.client_addresses
        set is_default = false
        where client_id = new.client_id
          and id is distinct from new.id
          and is_default = true;
    end if;

    return new;
end;
$$;


revoke all
on function public.clear_previous_default_client_address()
from public;


create trigger client_addresses_clear_previous_default
before insert or update of client_id, is_default
on public.client_addresses
for each row
when (new.is_default = true)
execute function public.clear_previous_default_client_address();


-- ============================================================
-- Trusted Admin Promotion
--
-- The only exposed role-transition RPC is a CLIENT -> ADMIN
-- promotion. It is intentionally unavailable to anon and
-- authenticated Consumer roles. Initial Admin bootstrap must use
-- this service_role/trusted boundary, not a Consumer path.
-- ============================================================

create or replace function public.promote_user_to_admin(
    p_user_id uuid,
    p_department text default null
)
returns public.user_profiles
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_profile public.user_profiles;
begin
    update public.user_profiles
    set
        role = 'ADMIN',
        department = p_department
    where id = p_user_id
      and role = 'CLIENT'
    returning *
    into v_profile;

    if v_profile.id is null then
        raise exception
            'CLIENT profile % does not exist or is already ADMIN',
            p_user_id;
    end if;

    return v_profile;
end;
$$;


revoke all
on function public.promote_user_to_admin(uuid, text)
from public;

grant execute
on function public.promote_user_to_admin(uuid, text)
to service_role;


-- Admin authorization query contract:
--
-- An authenticated user may call ensure_current_user_profile() and
-- read only its own user_profiles row through
-- user_profiles_owner_select. It is authorized for apps/user-web
-- only when role = 'ADMIN'.

commit;
