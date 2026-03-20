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
  - Required only when admins upload images from the frontend.
- `NEXT_PUBLIC_ALLOWED_LOGIN_DOMAIN`
  - Defaults to `kookmin.ac.kr`.
- `NEXT_PUBLIC_ADMIN_EMAILS`
  - Comma, space, or newline separated email list.
- `NEXT_PUBLIC_DOUM_MEMBER_EMAILS`
  - Comma, space, or newline separated email list.

## Notes
- The OAuth callback route is implemented at `src/app/auth/callback/page.tsx`.
- Login button starts Supabase Google OAuth directly.
- Public reads and authenticated writes depend on Supabase Auth/DB/Storage policies being configured on the project.
