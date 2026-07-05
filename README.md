# Do,um Frontend

Next.js App Router frontend for the Do,um website.

## Structure

```text
Frontend/
  src/
    app/              # App Router routes, layouts, route handlers
    components/       # Shared UI, page-level components, feature views
    hooks/            # Client hooks
    lib/              # Supabase, auth, content APIs, utilities
  public/             # Static assets served from /
  docs/               # Supabase and environment documentation
  scripts/            # Local build/asset scripts
  supabase/           # Supabase config and migrations
  _vendor/            # Vendored third-party source
```

## Commands

```bash
pnpm install
pnpm dev
pnpm build
```
