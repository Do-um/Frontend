begin;

-- Run Frontend/docs/supabase-schema.sql first.

alter table public.users
  add column if not exists auth_user_id uuid;

update public.users as public_users
set auth_user_id = auth_users.id
from auth.users as auth_users
where public_users.auth_user_id is null
  and lower(public_users.email) = lower(coalesce(auth_users.email, ''));

create unique index if not exists idx_users_auth_user_id
on public.users(auth_user_id)
where auth_user_id is not null;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.current_auth_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.current_public_user_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_user_id = public.current_auth_user_id()
     or (
       public.current_auth_user_id() is not null
       and auth_user_id is null
       and lower(email) = public.current_user_email()
     )
  order by case when auth_user_id = public.current_auth_user_id() then 0 else 1 end
  limit 1
$$;

create or replace function public.is_allowed_login_email()
returns boolean
language sql
stable
as $$
  select public.current_user_email() like '%@kookmin.ac.kr'
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where (
      auth_user_id = public.current_auth_user_id()
      or (
        public.current_auth_user_id() is not null
        and auth_user_id is null
        and lower(email) = public.current_user_email()
      )
    )
      and role = 'ADMIN'
  )
$$;

create or replace function public.is_rental_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where (
      auth_user_id = public.current_auth_user_id()
      or (
        public.current_auth_user_id() is not null
        and auth_user_id is null
        and lower(email) = public.current_user_email()
      )
    )
      and role in ('ADMIN', 'DOUM_MEMBER', 'MEMBER', 'STAFF')
  )
$$;

create or replace function public.prevent_non_admin_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_users_prevent_non_admin_user_role_change on public.users;
create trigger trg_users_prevent_non_admin_user_role_change
before update on public.users
for each row
execute function public.prevent_non_admin_user_role_change();

grant usage on schema public to anon, authenticated;
grant usage, select on all sequences in schema public to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'introduce',
    'introduce_activity_image',
    'projects',
    'project_images',
    'project_tags',
    'project_members',
    'club_content',
    'club_program',
    'club_recruit_content',
    'introduce_staff',
    'rental_items'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables as t
      where t.table_schema = 'public'
        and t.table_name = table_name
    ) then
      execute format('grant select on table public.%I to anon, authenticated', table_name);
      execute format('grant insert, update, delete on table public.%I to authenticated', table_name);
      execute format('alter table public.%I enable row level security', table_name);

      execute format('drop policy if exists %I on public.%I', table_name || ' public read', table_name);
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        table_name || ' public read',
        table_name
      );

      execute format('drop policy if exists %I on public.%I', table_name || ' admin write', table_name);
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
        table_name || ' admin write',
        table_name
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'users'
  ) then
    revoke all on table public.users from anon;
    grant select, insert, update on table public.users to authenticated;
    alter table public.users enable row level security;

    drop policy if exists "users self read" on public.users;
    create policy "users self read"
    on public.users
    for select
    to authenticated
    using (
      public.current_auth_user_id() is not null
      and (
        auth_user_id = public.current_auth_user_id()
        or (auth_user_id is null and lower(email) = public.current_user_email())
      )
    );

    drop policy if exists "users self insert" on public.users;
    create policy "users self insert"
    on public.users
    for insert
    to authenticated
    with check (
      public.current_auth_user_id() is not null
      and auth_user_id = public.current_auth_user_id()
      and lower(email) = public.current_user_email()
      and public.is_allowed_login_email()
    );

    drop policy if exists "users self update" on public.users;
    create policy "users self update"
    on public.users
    for update
    to authenticated
    using (
      public.current_auth_user_id() is not null
      and (
        auth_user_id = public.current_auth_user_id()
        or (auth_user_id is null and lower(email) = public.current_user_email())
      )
    )
    with check (
      public.current_auth_user_id() is not null
      and auth_user_id = public.current_auth_user_id()
      and lower(email) = public.current_user_email()
      and public.is_allowed_login_email()
    );

    drop policy if exists "users admin read all" on public.users;
    create policy "users admin read all"
    on public.users
    for select
    to authenticated
    using (public.is_admin());

    drop policy if exists "users admin update all" on public.users;
    create policy "users admin update all"
    on public.users
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'rentals'
  ) then
    revoke all on table public.rentals from anon;
    grant select, insert, update on table public.rentals to authenticated;
    alter table public.rentals enable row level security;

    drop policy if exists "rentals own read" on public.rentals;
    create policy "rentals own read"
    on public.rentals
    for select
    to authenticated
    using (user_id = public.current_public_user_id()::text);

    drop policy if exists "rentals schedule read" on public.rentals;
    create policy "rentals schedule read"
    on public.rentals
    for select
    to authenticated
    using (
      public.is_rental_user()
      and status = 'RENTED'
    );

    drop policy if exists "rentals own insert" on public.rentals;
    create policy "rentals own insert"
    on public.rentals
    for insert
    to authenticated
    with check (
      public.is_rental_user()
      and user_id = public.current_public_user_id()::text
    );

    drop policy if exists "rentals own update" on public.rentals;
    create policy "rentals own update"
    on public.rentals
    for update
    to authenticated
    using (
      public.is_admin()
      or (
        public.is_rental_user()
        and user_id = public.current_public_user_id()::text
      )
    )
    with check (
      public.is_admin()
      or (
        public.is_rental_user()
        and user_id = public.current_public_user_id()::text
      )
    );
  end if;
end
$$;

commit;

-- Optional storage policies
-- The frontend defaults to the public bucket name `images`.
--
-- insert into storage.buckets (id, name, public)
-- values ('images', 'images', true)
-- on conflict (id) do nothing;
--
-- create policy "public read storage"
-- on storage.objects
-- for select
-- to anon, authenticated
-- using (bucket_id = 'images');
--
-- create policy "authenticated upload storage"
-- create policy "admin upload storage"
-- on storage.objects
-- for insert
-- to authenticated
-- with check (bucket_id = 'images' and public.is_admin());
--
-- create policy "admin update storage"
-- on storage.objects
-- for update
-- to authenticated
-- using (bucket_id = 'images' and public.is_admin())
-- with check (bucket_id = 'images' and public.is_admin());
--
-- create policy "admin delete storage"
-- on storage.objects
-- for delete
-- to authenticated
-- using (bucket_id = 'images' and public.is_admin());
