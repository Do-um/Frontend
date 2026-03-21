begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rentals'
      and column_name = 'rented_at'
  ) then
    execute 'alter table public.rentals alter column rented_at set default now()';
    execute 'update public.rentals set rented_at = coalesce(rented_at, now()) where rented_at is null';
    execute 'alter table public.rentals alter column rented_at set not null';
  end if;
end
$$;

commit;
