begin;

grant usage on schema public to authenticated;

revoke all on table public.bet_caught_history from anon;
grant select, insert, delete on table public.bet_caught_history to authenticated;

commit;
