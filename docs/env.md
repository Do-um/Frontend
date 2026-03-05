# Frontend Environment Variables

## Required
- `NEXT_PUBLIC_API_BASE_URL`
  - Backend API base URL used by the frontend.
  - Example: `http://localhost:8080`
- `NEXT_PUBLIC_OAUTH_REDIRECT_URI`
  - OAuth login redirect URI registered on the backend.
  - Example: `http://localhost:3000/`

## Mapping To Backend
- `app.oauth2.redirect-uri` (backend) should match `NEXT_PUBLIC_OAUTH_REDIRECT_URI` (frontend).
- `JWT_SECRET` and other backend secrets must never be exposed to the frontend.

## Notes
- The OAuth callback route is implemented at `src/app/auth/callback/page.tsx`.
- If backend redirects to `/` (as in the provided YAML), the home page handles token parsing.
- Login button uses the API base URL to start OAuth.
