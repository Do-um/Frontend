begin;

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

commit;
