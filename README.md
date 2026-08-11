# Mark Developers

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Client SDK config (from Firebase Console) |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SESSION_SECRET` | Key for signing session JWTs (generate: `openssl rand -hex 48`) |

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm test` — Run unit tests
- `npx playwright test` — Run E2E tests
- `npm run deploy` — Build and deploy to Cloudflare

## Deployment

The app deploys to Cloudflare Workers via OpenNext. See `wrangler.jsonc` (main) and
`wrangler.admin.jsonc` (admin) for configuration.

Two environments are defined using Wrangler `env` blocks:

| Branch | Environment | Main worker | Admin worker | Domains |
|---|---|---|---|---|
| `production` | (top-level config) | `markdev` | `admin` | `markdevelopers.in` / `admindashboard.markdevelopers.in` |
| `develop` | `staging` | `markdev-staging` | `admin-staging` | `dev.markdevelopers.in` / `admin-dev.markdevelopers.in` |

Deploys are driven by GitHub Actions (`.github/workflows/ci.yml`):

- Push to `develop` → build once, deploy `markdev-staging` + `admin-staging`, set their secrets.
- Push to `production` → build once, deploy `markdev` + `admin`, set their secrets.

Manual deploys:

```bash
# Production main / admin
npx wrangler deploy --config wrangler.jsonc
npx wrangler deploy --config wrangler.admin.jsonc

# Staging main / admin
npx wrangler deploy --config wrangler.jsonc --env staging
npx wrangler deploy --config wrangler.admin.jsonc --env staging
```

Staging build (do this before the staging deploys above, with staging env vars):

```bash
ENVIRONMENT=staging PUBLIC_HOST=dev.markdevelopers.in ADMIN_HOST_PREFIX=admin-dev. \
  npx opennextjs-cloudflare build
```
