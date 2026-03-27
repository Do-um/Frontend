begin;

create or replace function public.is_doum_member()
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

create table if not exists public.bet_caught_history (
  id text primary key,
  name text not null,
  normalized_name text not null,
  mode text not null check (mode in ('ai_excuse', 'bomb_pass', 'ladder', 'roulette_manual', 'manual')),
  detail text null,
  created_at timestamptz not null default now(),
  created_by_public_user_id bigint null references public.users(id) on delete set null
);

create index if not exists idx_bet_caught_history_created_at
on public.bet_caught_history(created_at desc);

create index if not exists idx_bet_caught_history_normalized_name
on public.bet_caught_history(normalized_name);

revoke all on table public.bet_caught_history from anon;
grant select, insert, delete on table public.bet_caught_history to authenticated;

alter table public.bet_caught_history enable row level security;

drop policy if exists "bet history doum read" on public.bet_caught_history;
create policy "bet history doum read"
on public.bet_caught_history
for select
to authenticated
using (public.is_doum_member());

drop policy if exists "bet history doum insert" on public.bet_caught_history;
create policy "bet history doum insert"
on public.bet_caught_history
for insert
to authenticated
with check (
  public.is_doum_member()
  and created_by_public_user_id = public.current_public_user_id()
);

drop policy if exists "bet history admin delete" on public.bet_caught_history;
create policy "bet history admin delete"
on public.bet_caught_history
for delete
to authenticated
using (public.is_admin());

commit;
