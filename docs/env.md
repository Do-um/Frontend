# Frontend Environment Variables

## Required
- `NEXT_PUBLIC_SUPABASE_URL`
  - Supabase project URL.
  - Example: `https://your-project.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Browser-safe anon key used by `supabase-js`.
  - Example: `eyJ...`

## Optional
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
  - Defaults to `images`.
  - Change it only if you want a different Storage bucket name.
- `NEXT_PUBLIC_ALLOWED_LOGIN_DOMAIN`
  - Browser-visible login domain label.
  - Defaults to `kookmin.ac.kr`.
- `ALLOWED_LOGIN_DOMAIN`
  - Server-side allowed email domain.
  - Defaults to `NEXT_PUBLIC_ALLOWED_LOGIN_DOMAIN` or `kookmin.ac.kr`.
- `ADMIN_EMAILS`
  - Comma, space, or newline separated email list.
- `DOUM_MEMBER_EMAILS`
  - Comma, space, or newline separated email list.

## Notes
- The OAuth callback route is implemented at `src/app/auth/callback/route.ts`.
- Login button starts Supabase Google OAuth directly and exchanges the PKCE code on the server.
- The callback route also syncs the `users` profile server-side, so admin/member bootstrap no longer depends on browser env values.
- Auth state is refreshed through `proxy.ts`, so production should keep the Supabase env configured on Vercel.
- Public reads and authenticated writes depend on Supabase Auth/DB/Storage policies being configured on the project.
- Run `docs/supabase-schema.sql` first if the Supabase project does not already have the tables/columns from this app.
- Run `docs/supabase-rls.sql` once in the Supabase SQL Editor after creating or migrating the tables.
- Storage image upload assumes a public bucket named `images` unless `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` is overridden.
- Storage writes are intended for admins only. Run the latest storage policy migration before using image uploads in production.
- The SQL file assumes the allowed login domain is `@kookmin.ac.kr`. Change that function if your production policy differs.
