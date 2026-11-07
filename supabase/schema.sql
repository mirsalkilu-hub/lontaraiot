create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (category in ('Program', 'Kegiatan', 'Inspirasi', 'Pengumuman')),
  excerpt text not null check (char_length(excerpt) between 1 and 220),
  content text not null check (char_length(content) between 1 and 50000),
  published_at date not null default current_date,
  image_path text,
  author_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.posts
  add column if not exists published_at date not null default current_date;

alter table public.posts
  add column if not exists author_id uuid references auth.users(id) on delete restrict;

create index if not exists posts_published_at_idx
  on public.posts (published_at desc, created_at desc);

alter table public.posts enable row level security;

drop policy if exists "Published posts are visible to everyone" on public.posts;
create policy "Published posts are visible to everyone"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can publish posts" on public.posts;
create policy "Admins can publish posts"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
  on public.posts for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
  on public.posts for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "News images are publicly readable" on storage.objects;
create policy "News images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'news-images');

drop policy if exists "Admins can upload news images" on storage.objects;
create policy "Admins can upload news images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'news-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can update news images" on storage.objects;
create policy "Admins can update news images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'news-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'news-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can delete news images" on storage.objects;
create policy "Admins can delete news images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'news-images'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
