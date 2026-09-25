-- ============================================================
-- Mall v2
-- Admin ProductPost save RPC
--
-- Why:
--   Creating/updating a ProductPost and replacing its ordered
--   ProductPost <-> Product links (product_post_products) were
--   separate PostgREST requests, so a failure between them could
--   leave a partially saved ProductPost. This RPC performs both
--   in ONE transaction.
--
-- Boundary:
--   - service_role only (Admin Route Handler after ADMIN check).
--   - Only product_posts + product_post_products are written.
--     Category links, Products and Ware are not touched.
--
-- Input:
--   p_product_post_id  NULL  -> create
--                      uuid  -> update (raises P0002 if missing)
--   p_post             product_posts columns to set (snake_case):
--                      title, slug, summary, content,
--                      thumbnail_url, status, published_at
--                      Update is a patch: only present keys change.
--   p_product_ids      ordered Product ids (display_order = position,
--                      duplicates keep their first position).
--                      NULL -> links unchanged (update) / none (create)
--
-- Output:
--   the saved public.product_posts row
-- ============================================================

create or replace function public.admin_save_product_post(
    p_product_post_id uuid,
    p_post jsonb,
    p_product_ids uuid[] default null
)
returns public.product_posts
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_post public.product_posts;
    v_missing_count bigint;
begin

    p_post := coalesce(p_post, '{}'::jsonb);

    if jsonb_typeof(p_post) <> 'object' then
        raise exception 'ProductPost payload must be a JSON object';
    end if;

    if p_post ? 'title'
       and coalesce(btrim(p_post ->> 'title'), '') = '' then
        raise exception 'ProductPost title is required';
    end if;

    if p_product_post_id is null
       and not (p_post ? 'title') then
        raise exception 'ProductPost title is required';
    end if;

    if p_post ? 'status'
       and (p_post ->> 'status') is distinct from 'DRAFT'
       and (p_post ->> 'status') is distinct from 'PUBLISHED' then
        raise exception 'ProductPost status must be DRAFT or PUBLISHED';
    end if;

    if p_post ? 'content'
       and jsonb_typeof(p_post -> 'content') is distinct from 'object' then
        raise exception 'ProductPost content must be a JSON object';
    end if;


    -- --------------------------------------------------------
    -- Validate Product links before any write.
    -- --------------------------------------------------------

    if p_product_ids is not null then
        if array_position(p_product_ids, null) is not null then
            raise exception 'productIds must not contain null';
        end if;

        select count(*)
          into v_missing_count
        from (select distinct unnest(p_product_ids) as product_id) requested
        where not exists (
            select 1
            from public.products p
            where p.id = requested.product_id
        );

        if v_missing_count > 0 then
            raise exception
                'productIds contains a Product that does not exist.';
        end if;
    end if;


    -- --------------------------------------------------------
    -- ProductPost
    -- --------------------------------------------------------

    if p_product_post_id is null then

        insert into public.product_posts (
            title,
            slug,
            summary,
            content,
            thumbnail_url,
            status,
            published_at
        )
        values (
            btrim(p_post ->> 'title'),
            p_post ->> 'slug',
            p_post ->> 'summary',
            coalesce(p_post -> 'content', '{}'::jsonb),
            p_post ->> 'thumbnail_url',
            coalesce(p_post ->> 'status', 'DRAFT'),
            (p_post ->> 'published_at')::timestamptz
        )
        returning * into v_post;

    else

        update public.product_posts pp
           set title = case when p_post ? 'title'
                            then btrim(p_post ->> 'title') else pp.title end,
               slug = case when p_post ? 'slug'
                           then p_post ->> 'slug' else pp.slug end,
               summary = case when p_post ? 'summary'
                              then p_post ->> 'summary' else pp.summary end,
               content = case when p_post ? 'content'
                              then p_post -> 'content' else pp.content end,
               thumbnail_url = case when p_post ? 'thumbnail_url'
                                    then p_post ->> 'thumbnail_url' else pp.thumbnail_url end,
               status = case when p_post ? 'status'
                             then p_post ->> 'status' else pp.status end,
               published_at = case when p_post ? 'published_at'
                                   then (p_post ->> 'published_at')::timestamptz
                                   else pp.published_at end,
               updated_at = now()
         where pp.id = p_product_post_id
        returning pp.* into v_post;

        if v_post.id is null then
            raise exception
                'ProductPost % not found',
                p_product_post_id
                using errcode = 'P0002';
        end if;

    end if;


    -- --------------------------------------------------------
    -- ProductPost <-> Product links (same transaction)
    -- --------------------------------------------------------

    if p_product_ids is not null then

        delete from public.product_post_products
        where product_post_id = v_post.id;

        insert into public.product_post_products (
            product_post_id,
            product_id,
            display_order
        )
        select
            v_post.id,
            ordered.product_id,
            (row_number() over (order by ordered.first_position) - 1)::integer
        from (
            select
                requested.product_id,
                min(requested.position) as first_position
            from unnest(p_product_ids) with ordinality
                 as requested(product_id, position)
            group by requested.product_id
        ) ordered;

    end if;


    return v_post;
end;
$$;


revoke all
on function public.admin_save_product_post(uuid, jsonb, uuid[])
from public, anon, authenticated;

grant execute
on function public.admin_save_product_post(uuid, jsonb, uuid[])
to service_role;
