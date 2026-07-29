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
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm test` — Run unit tests
- `npx playwright test` — Run E2E tests
- `npm run deploy` — Build and deploy to Cloudflare

## Deployment

The app deploys to Cloudflare Workers via OpenNext. See `wrangler.jsonc` for configuration.
