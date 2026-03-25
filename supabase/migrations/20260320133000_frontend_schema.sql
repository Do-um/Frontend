begin;

create table if not exists public.users (
  id bigserial primary key,
  email varchar(255) not null unique,
  name varchar(100) not null,
  profile_image_url varchar(500),
  provider varchar(50) not null default 'google',
  role varchar(20) not null default 'OUTSIDER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.introduce (
  id bigserial primary key,
  activity_id varchar(100) not null,
  activity_type varchar(20) not null default 'MAIN',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.introduce
  add column if not exists activity_type varchar(20) not null default 'MAIN',
  add column if not exists activity_date date,
  add column if not exists location varchar(200),
  add column if not exists participant_count integer,
  add column if not exists participant_names text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'introduce'
      and column_name = 'activity_date'
      and data_type = 'date'
  ) then
    execute 'alter table public.introduce alter column activity_date type text using activity_date::text';
  end if;
end
$$;

alter table public.introduce
  alter column description set default '';

update public.introduce
set description = coalesce(description, ''),
    participant_count = coalesce(participant_count, 0),
    participant_names = coalesce(participant_names, '')
where description is null
   or participant_count is null
   or participant_names is null;

create table if not exists public.introduce_activity_image (
  id bigserial primary key,
  introduce_id bigint not null references public.introduce(id) on delete cascade,
  image_url varchar(500) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigserial primary key,
  project_id varchar(100) not null unique,
  title varchar(200) not null,
  summary varchar(255) not null,
  description text not null,
  thumbnail_url varchar(1000) not null,
  team_name varchar(100),
  period_start date,
  period_end date,
  link_github varchar(1000),
  link_demo varchar(1000),
  link_notion varchar(1000),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  project_pk bigint not null references public.projects(id) on delete cascade,
  image_url varchar(1000) not null
);

create table if not exists public.project_tags (
  project_pk bigint not null references public.projects(id) on delete cascade,
  tag varchar(100) not null
);

create table if not exists public.project_members (
  project_pk bigint not null references public.projects(id) on delete cascade,
  member_name varchar(100) not null
);

create table if not exists public.club_content (
  id bigserial primary key,
  intro_title varchar(100) not null default '',
  intro_lead varchar(255) not null default '',
  intro_description text not null default '',
  activity_section_title varchar(100) not null default '',
  history_section_title varchar(150) not null default '',
  study_caption varchar(100) not null default '',
  study_title varchar(150) not null default '',
  learn_title varchar(50) not null default '',
  learn_description varchar(255) not null default '',
  grow_title varchar(50) not null default '',
  grow_description varchar(255) not null default '',
  share_title varchar(50) not null default '',
  share_description varchar(255) not null default '',
  hero_banner_image_url varchar(500) not null default '/hero-banner.png',
  study_image_url varchar(500) not null default '/skill.png',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_program (
  id bigserial primary key,
  title varchar(100) not null,
  description varchar(255) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_recruit_content (
  id bigserial primary key,
  overview_title varchar(100) not null default '',
  overview_description text not null default '',
  application_period_title varchar(100) not null default '',
  application_start varchar(100) not null default '',
  application_end varchar(100) not null default '',
  interview_period_title varchar(100) not null default '',
  interview_start varchar(100) not null default '',
  interview_end varchar(100) not null default '',
  target_section_title varchar(100) not null default '',
  target_section_description text not null default '',
  target_items text not null default '',
  cta_title varchar(150) not null default '',
  cta_button_label varchar(50) not null default '',
  apply_url varchar(1000) not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'introduce_member'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'introduce_staff'
  ) then
    execute 'alter table public.introduce_member rename to introduce_staff';
  end if;
end
$$;

create table if not exists public.introduce_staff (
  id bigserial primary key,
  user_id bigint,
  name varchar(50) not null,
  department varchar(50) not null default '',
  role varchar(50) not null,
  description varchar(255) not null,
  profile_image varchar(500) not null,
  github_url varchar(500),
  instagram_url varchar(500)
);

alter table public.introduce_staff
  add column if not exists user_id bigint,
  add column if not exists department varchar(50) not null default '',
  add column if not exists github_url varchar(500),
  add column if not exists instagram_url varchar(500);

create table if not exists public.rental_items (
  id bigserial primary key,
  name varchar(100) not null,
  category varchar(50) not null default 'ETC',
  description text,
  item_image varchar(500),
  total_quantity integer not null default 0,
  available_quantity integer not null default 0,
  max_rental_days integer not null default 7,
  status varchar(20) not null default 'AVAILABLE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rental_items
  add column if not exists category varchar(50) not null default 'ETC',
  add column if not exists item_image varchar(500),
  add column if not exists max_rental_days integer not null default 7,
  add column if not exists status varchar(20) not null default 'AVAILABLE';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rental_items'
      and column_name = 'image_url'
  ) then
    execute 'update public.rental_items set item_image = coalesce(item_image, image_url) where image_url is not null';
  end if;
end
$$;

create table if not exists public.rentals (
  id bigserial primary key,
  rental_item_id bigint not null references public.rental_items(id) on delete restrict,
  user_id varchar(64) not null,
  quantity integer not null default 1,
  start_date date not null,
  end_date date not null,
  purpose text,
  status varchar(30) not null default 'RENTED',
  rented_at timestamptz not null default now(),
  returned_at timestamptz
);

alter table public.rentals
  add column if not exists rental_item_id bigint,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists purpose text,
  add column if not exists status varchar(30) not null default 'RENTED',
  add column if not exists rented_at timestamptz not null default now(),
  add column if not exists returned_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rentals'
      and column_name = 'item_id'
  ) then
    execute 'update public.rentals set rental_item_id = coalesce(rental_item_id, item_id) where item_id is not null';
  end if;
end
$$;

do $$
declare
  user_id_type text;
begin
  select data_type
    into user_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'rentals'
    and column_name = 'user_id';

  if user_id_type is not null and user_id_type <> 'character varying' then
    execute 'alter table public.rentals alter column user_id type varchar(64) using user_id::varchar';
  end if;
end
$$;

update public.rentals
set start_date = coalesce(start_date, cast(rented_at as date), current_date),
    end_date = coalesce(end_date, cast(rented_at as date), current_date),
    status = coalesce(status, 'RENTED'),
    rented_at = coalesce(rented_at, now())
where start_date is null
   or end_date is null
   or status is null
   or rented_at is null;

alter table public.rentals
  alter column rental_item_id set not null,
  alter column user_id set not null,
  alter column start_date set not null,
  alter column end_date set not null,
  alter column status set not null,
  alter column rented_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_rentals_rental_item'
  ) then
    alter table public.rentals
      add constraint fk_rentals_rental_item
      foreign key (rental_item_id) references public.rental_items(id) on delete restrict;
  end if;
end
$$;

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_introduce_created_at_desc on public.introduce(created_at desc);
create index if not exists idx_introduce_activity_type_created_at_desc on public.introduce(activity_type, created_at desc);
create index if not exists idx_introduce_activity_image_introduce_id on public.introduce_activity_image(introduce_id);
create index if not exists idx_introduce_activity_image_order on public.introduce_activity_image(introduce_id, sort_order, id);
create index if not exists idx_projects_updated_at_desc on public.projects(updated_at desc);
create index if not exists idx_rentals_user_id on public.rentals(user_id);
create index if not exists idx_rentals_rental_item_id on public.rentals(rental_item_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'introduce',
    'projects',
    'club_content',
    'club_program',
    'club_recruit_content',
    'rental_items'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end
$$;

commit;
