# Frontend Environment Variables

## Required
- `NEXT_PUBLIC_API_BASE_URL`
  - Backend API base URL used by the frontend.
  - Example: `http://localhost:8080`

## Mapping To Backend
- Backend `OAUTH2_REDIRECT_URI` should point to the frontend callback route.
  - Example: `https://your-frontend-domain.vercel.app/auth/callback`
- Backend `FRONTEND_URL` should match the deployed frontend origin.
  - Example: `https://your-frontend-domain.vercel.app`
- `JWT_SECRET` and other backend secrets must never be exposed to the frontend.

## Notes
- The OAuth callback route is implemented at `src/app/auth/callback/page.tsx`.
- If backend redirects to `/`, the home page also handles token parsing.
- Login button uses the API base URL to start OAuth.
