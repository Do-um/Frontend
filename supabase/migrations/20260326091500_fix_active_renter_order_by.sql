begin;

create or replace function public.get_active_renters_by_item_ids(target_item_ids bigint[])
returns table (
  rental_item_id bigint,
  reserved_by_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_rental_user() then
    raise exception 'Active renter access denied.';
  end if;

  return query
  select distinct
    r.rental_item_id,
    nullif(trim(u.name), '') as reserved_by_name
  from public.rentals r
  left join public.users u on u.id::text = r.user_id
  where r.rental_item_id = any(target_item_ids)
    and r.status = 'RENTED'
    and r.end_date >= current_date
    and nullif(trim(u.name), '') is not null
  order by r.rental_item_id asc, reserved_by_name asc;
end;
$$;

revoke all on function public.get_active_renters_by_item_ids(bigint[]) from public;
grant execute on function public.get_active_renters_by_item_ids(bigint[]) to authenticated;

commit;
