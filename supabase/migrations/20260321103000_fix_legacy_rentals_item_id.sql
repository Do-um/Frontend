begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rentals'
      and column_name = 'item_id'
  ) then
    execute 'update public.rentals
             set rental_item_id = coalesce(rental_item_id, item_id)
             where rental_item_id is null
               and item_id is not null';

    execute 'alter table public.rentals alter column item_id drop not null';
  end if;
end
$$;

commit;
