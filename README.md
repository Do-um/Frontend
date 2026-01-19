# DO,Um Frontend

Frontend project for the DO,Um club website.

```
frontend/
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Shared UI/Layout components
│   ├── api/            # Client API hooks
│   └── styles/         # Global/utility styles
├── public/
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn

### Run

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Backend Integration

- Client requests use `/api/*`.
- Local dev proxies to `http://localhost:8080` via `next.config.ts` rewrites.
- Backend run: `Backend` then `./gradlew bootRun`

## Tests

```bash
npm run lint
```

## Pages

- `/` home
- `/activity` activity overview
- `/activity/study` study
- `/activity/project` project
- `/activity/mogakko` mogakko
- `/rental` rental

## License

Internal project for DO,Um.
