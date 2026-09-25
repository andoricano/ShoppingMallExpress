-- Mall v2 image storage contract.
--
-- Bucket `images` stores Admin-uploaded catalog images whose public URLs are
-- persisted in text columns such as `product_posts.thumbnail_url`.
--
-- * Public read: objects are served through the public object URL.
-- * No anon/authenticated INSERT/UPDATE/DELETE policy is defined on
--   `storage.objects` for this bucket. Uploads are only possible through a
--   signed upload URL issued by the Admin server boundary (service role), so
--   browsers never hold privileged credentials.
-- * Size and MIME type are enforced by the bucket itself.
insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'images',
    'images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
