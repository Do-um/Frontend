alter table public.introduce
  alter column activity_date type text
  using activity_date::text;
