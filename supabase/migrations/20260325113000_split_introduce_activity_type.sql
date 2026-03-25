alter table public.introduce
  add column if not exists activity_type varchar(20) not null default 'MAIN';

update public.introduce
set activity_type = 'STUDY'
where activity_id ilike '%study%'
   or activity_id like '%스터디%'
   or activity_id like '%모각코%'
   or description ilike '%study%'
   or description like '%스터디%'
   or description like '%모각코%'
   or coalesce(location, '') ilike '%study%'
   or coalesce(location, '') like '%스터디%'
   or coalesce(location, '') like '%모각코%'
   or coalesce(participant_names, '') ilike '%study%'
   or coalesce(participant_names, '') like '%스터디%'
   or coalesce(participant_names, '') like '%모각코%';

update public.introduce
set activity_type = 'MAIN'
where activity_type is null
   or activity_type not in ('MAIN', 'STUDY');

create index if not exists idx_introduce_activity_type_created_at_desc
  on public.introduce(activity_type, created_at desc);
