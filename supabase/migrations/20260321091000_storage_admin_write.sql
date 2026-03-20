begin;

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "public read storage" on storage.objects;
create policy "public read storage"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'images');

drop policy if exists "authenticated upload storage" on storage.objects;
drop policy if exists "authenticated update storage" on storage.objects;
drop policy if exists "authenticated delete storage" on storage.objects;
drop policy if exists "admin upload storage" on storage.objects;
drop policy if exists "admin update storage" on storage.objects;
drop policy if exists "admin delete storage" on storage.objects;

create policy "admin upload storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'images'
  and public.is_admin()
);

create policy "admin update storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'images'
  and public.is_admin()
)
with check (
  bucket_id = 'images'
  and public.is_admin()
);

create policy "admin delete storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'images'
  and public.is_admin()
);

commit;
