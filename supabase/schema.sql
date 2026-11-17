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

alter table public.posts
  add column if not exists created_at timestamptz not null default now();

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

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  activity_type text not null check (char_length(activity_type) between 1 and 80),
  description text not null check (char_length(description) between 1 and 2000),
  activity_date date not null,
  location text not null check (char_length(location) between 1 and 160),
  registration_open boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists activities_date_idx
  on public.activities (activity_date);

alter table public.activities enable row level security;

drop policy if exists "Activities are publicly visible" on public.activities;
create policy "Activities are publicly visible"
  on public.activities for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can create activities" on public.activities;
create policy "Admins can create activities"
  on public.activities for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can update activities" on public.activities;
create policy "Admins can update activities"
  on public.activities for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete activities" on public.activities;
create policy "Admins can delete activities"
  on public.activities for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.activities to anon, authenticated;
grant insert, update, delete on public.activities to authenticated;

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  gender text not null default 'Belum diisi',
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 1 and 40),
  organization text not null check (char_length(organization) between 1 and 160),
  attended boolean not null default false,
  created_at timestamptz not null default now(),
  unique (activity_id, email),
  constraint registrations_gender_check
    check (gender in ('Laki-laki', 'Perempuan', 'Memilih tidak menjawab', 'Belum diisi'))
);

alter table public.registrations
  add column if not exists gender text not null default 'Belum diisi';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registrations_gender_check'
      and conrelid = 'public.registrations'::regclass
  ) then
    alter table public.registrations
      add constraint registrations_gender_check
      check (gender in ('Laki-laki', 'Perempuan', 'Memilih tidak menjawab', 'Belum diisi'));
  end if;
end;
$$;

create index if not exists registrations_activity_idx
  on public.registrations (activity_id, created_at desc);

create unique index if not exists registrations_activity_email_lower_idx
  on public.registrations (activity_id, lower(email));

alter table public.registrations enable row level security;

drop policy if exists "Participants can register for open activities" on public.registrations;
create policy "Participants can register for open activities"
  on public.registrations for insert
  to anon, authenticated
  with check (
    attended = false
    and exists (
      select 1
      from public.activities
      where activities.id = activity_id
        and activities.registration_open
        and activities.activity_date >= current_date
    )
  );

drop policy if exists "Admins can view registrations" on public.registrations;
create policy "Admins can view registrations"
  on public.registrations for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update registrations" on public.registrations;
create policy "Admins can update registrations"
  on public.registrations for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant insert on public.registrations to anon, authenticated;
grant select, update on public.registrations to authenticated;

create table if not exists public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  session_date date not null,
  attendance_token uuid not null default gen_random_uuid(),
  checkin_open boolean not null default true,
  created_at timestamptz not null default now(),
  unique (activity_id, session_date)
);

alter table public.activity_sessions
  add column if not exists attendance_token uuid not null default gen_random_uuid();

alter table public.activity_sessions
  add column if not exists checkin_open boolean not null default true;

create index if not exists activity_sessions_activity_date_idx
  on public.activity_sessions (activity_id, session_date);

create unique index if not exists activity_sessions_attendance_token_idx
  on public.activity_sessions (attendance_token);

alter table public.activity_sessions enable row level security;

drop policy if exists "Admins can view activity sessions" on public.activity_sessions;
create policy "Admins can view activity sessions"
  on public.activity_sessions for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can create activity sessions" on public.activity_sessions;
create policy "Admins can create activity sessions"
  on public.activity_sessions for insert
  to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update activity sessions" on public.activity_sessions;
create policy "Admins can update activity sessions"
  on public.activity_sessions for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete activity sessions" on public.activity_sessions;
create policy "Admins can delete activity sessions"
  on public.activity_sessions for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select, insert, update, delete on public.activity_sessions to authenticated;

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.activity_sessions(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete cascade,
  attended boolean not null default false,
  marked_at timestamptz,
  unique (session_id, registration_id)
);

create index if not exists attendance_records_session_idx
  on public.attendance_records (session_id, registration_id);

alter table public.attendance_records enable row level security;

drop policy if exists "Admins can view attendance records" on public.attendance_records;
create policy "Admins can view attendance records"
  on public.attendance_records for select
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can create attendance records" on public.attendance_records;
create policy "Admins can create attendance records"
  on public.attendance_records for insert
  to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update attendance records" on public.attendance_records;
create policy "Admins can update attendance records"
  on public.attendance_records for update
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete attendance records" on public.attendance_records;
create policy "Admins can delete attendance records"
  on public.attendance_records for delete
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select, insert, update, delete on public.attendance_records to authenticated;

create or replace function public.add_attendance_for_registration()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.attendance_records (session_id, registration_id)
  select activity_sessions.id, new.id
  from public.activity_sessions
  where activity_sessions.activity_id = new.activity_id
  on conflict (session_id, registration_id) do nothing;
  return new;
end;
$$;

drop trigger if exists registrations_add_attendance on public.registrations;
create trigger registrations_add_attendance
  after insert on public.registrations
  for each row execute function public.add_attendance_for_registration();

create or replace function public.add_attendance_for_session()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.attendance_records (session_id, registration_id)
  select new.id, registrations.id
  from public.registrations
  where registrations.activity_id = new.activity_id
  on conflict (session_id, registration_id) do nothing;
  return new;
end;
$$;

drop trigger if exists activity_sessions_add_attendance on public.activity_sessions;
create trigger activity_sessions_add_attendance
  after insert on public.activity_sessions
  for each row execute function public.add_attendance_for_session();

insert into public.activity_sessions (activity_id, session_date)
select id, activity_date
from public.activities
on conflict (activity_id, session_date) do nothing;

insert into public.attendance_records (session_id, registration_id, attended, marked_at)
select
  activity_sessions.id,
  registrations.id,
  registrations.attended,
  case when registrations.attended then registrations.created_at else null end
from public.activity_sessions
join public.registrations on registrations.activity_id = activity_sessions.activity_id
on conflict (session_id, registration_id) do nothing;

update public.attendance_records
set attended = true, marked_at = coalesce(marked_at, now())
from public.registrations, public.activity_sessions
where attendance_records.registration_id = registrations.id
  and attendance_records.session_id = activity_sessions.id
  and registrations.activity_id = activity_sessions.activity_id
  and registrations.attended = true
  and attendance_records.attended = false;

update public.registrations
set attended = false
where attended = true;

create or replace function public.get_shared_attendance_session(p_token uuid)
returns table (
  activity_title text,
  activity_type text,
  session_date date,
  location text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select activities.title, activities.activity_type, activity_sessions.session_date, activities.location
  from public.activity_sessions
  join public.activities on activities.id = activity_sessions.activity_id
  where activity_sessions.attendance_token = p_token
    and activity_sessions.checkin_open = true;
$$;

revoke all on function public.get_shared_attendance_session(uuid) from public;
grant execute on function public.get_shared_attendance_session(uuid) to anon, authenticated;

create or replace function public.submit_shared_attendance(
  p_token uuid,
  p_email text,
  p_phone text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(trim(p_email), '') = '' or
    regexp_replace(coalesce(trim(p_phone), ''), '[^0-9]', '', 'g') = '' then
    return false;
  end if;

  update public.attendance_records
  set attended = true, marked_at = now()
  from public.activity_sessions, public.registrations
  where attendance_records.session_id = activity_sessions.id
    and attendance_records.registration_id = registrations.id
    and activity_sessions.attendance_token = p_token
    and activity_sessions.checkin_open = true
    and lower(registrations.email) = lower(trim(p_email))
    and regexp_replace(registrations.phone, '[^0-9]', '', 'g') =
      regexp_replace(trim(p_phone), '[^0-9]', '', 'g');
  return found;
end;
$$;

revoke all on function public.submit_shared_attendance(uuid, text, text) from public;
grant execute on function public.submit_shared_attendance(uuid, text, text) to anon, authenticated;

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
