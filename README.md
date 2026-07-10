# Mark Developers

Premium building construction services — Next.js 16 (App Router) web application.

---

## Architecture Overview

```
Browser Request
      │
      ▼
┌─────────────────────────────────────────────────┐
│              proxy.ts (Middleware)               │
│  • Matches all routes except api/_next/favicon   │
│  • Multi-host routing (public vs admin)          │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   Public Host                Admin Host
  (localhost:3000)         (admin.localhost:3000)
          │                         │
          │  /admin/* → 404         │  / → redirect /admin/dashboard
          │  /about                 │  /admin/login → pass through
          │  /contact               │  /admin/* → session check
          │  / (home)               │     ├─ has session → render
          │                         │     └─ no session → redirect /admin/login
          ▼                         ▼
   ┌──────────────┐        ┌──────────────────┐
   │  (public)     │        │   (admin)         │
   │  Route Group  │        │   Route Group     │
   │  <main>       │        │   <></>           │
   └──────────────┘        └──────────────────┘
```

---

## Request Flow

### 1. Middleware (`proxy.ts`)

Runs on every request (except `api`, `_next/*`, `favicon.ico`).

```
Incoming Request
      │
      ▼
  Parse host header
      │
      ├── Unknown host → redirect to PUBLIC_HOST
      │
      ├── Public host?
      │     ├── /admin/* → rewrite to 404 (hide admin from public)
      │     └── else → NextResponse.next()
      │
      └── Admin host?
            ├── Not /admin/* → redirect to /admin/dashboard
            ├── /admin/login → NextResponse.next() (no auth)
            └── /admin/* (other)
                  ├── Has "session" cookie → NextResponse.next()
                  └── No cookie → redirect /admin/login
```

### 2. Routing

```
/ (Root Layout)
├── layout.tsx          → HTML shell, metadata, globals.css
├── not-found.tsx       → Custom 404 page
├── error.tsx           → Error boundary ("Something went wrong")
│
├── (public) Route Group
│   ├── layout.tsx      → Wraps in <main>
│   ├── page.tsx        → /         (Coming Soon)
│   ├── about/page.tsx  → /about    (About Us)
│   └── contact/page.tsx→ /contact  (Contact Us)
│
└── (admin) Route Group
    └── admin/
        ├── layout.tsx       → Fragment <></>
        ├── login/
        │   ├── page.tsx     → /admin/login   (Login page)
        │   └── login-form.tsx → Client component with form
        └── dashboard/
            └── page.tsx     → /admin/dashboard (Server component)
```

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  LOGIN                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LoginForm (Client Component)                                   │
│      │                                                          │
│      │ useActionState(login) on submit                          │
│      ▼                                                          │
│  login() Server Action (actions/index.ts)                       │
│      │                                                          │
│      ├─ Validate email/password                                 │
│      │   (demo: admin@example.com / password)                   │
│      │                                                          │
│      ├─ On failure → return { error: "Invalid..." }            │
│      │                                                          │
│      └─ On success →                                            │
│            ├─ Create base64 token:                              │
│            │   btoa({ userId, email, role })                    │
│            ├─ Set "session" cookie (httpOnly, secure in prod)   │
│            └─ redirect("/admin/dashboard")                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SESSION VERIFICATION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DashboardPage (Server Component)                               │
│      │                                                          │
│      ├─ cookies().get("session")                                │
│      ├─ getSessionUserId(token) → base64 decode → parse JSON    │
│      └─ Render welcome message with userId                      │
│                                                                 │
│  Middleware Auth Guard                                          │
│      │                                                          │
│      └─ On /admin/* (except /admin/login)                       │
│            Checks "session" cookie exists                       │
│            Missing → redirect /admin/login                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LOGOUT                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard "Log out" button                                     │
│      │                                                          │
│      │ form action={logout}                                     │
│      ▼                                                          │
│  logout() Server Action                                         │
│      │                                                          │
│      ├─ Deletes "session" cookie                                │
│      └─ redirect("/admin/login")                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
<RootLayout>                        Server  — app/layout.tsx
  ├─ <ErrorBoundary>                Client — app/error.tsx
  │
  ├─ (public) <PublicLayout>        Server  — app/(public)/layout.tsx
  │   ├─ <HomePage />               Server  — app/(public)/page.tsx
  │   ├─ <AboutPage />              Server  — app/(public)/about/page.tsx
  │   └─ <ContactPage />            Server  — app/(public)/contact/page.tsx
  │
  └─ (admin) <AdminLayout>          Server  — app/(admin)/admin/layout.tsx
      ├─ <LoginPage>                Server  — app/(admin)/admin/login/page.tsx
      │   └─ <LoginForm>            Client  — login-form.tsx
      │       └─ form → login() Server Action
      │
      └─ <DashboardPage>            Server  — app/(admin)/admin/dashboard/page.tsx
            └─ form → logout() Server Action
```

---

## Data Flow

```
┌──────────┐    ┌──────────────┐    ┌────────────────┐
│  Form     │───▶│ Server Action │───▶│ Cookie Store   │
│  (Client) │    │  (actions/)  │    │  (next/headers)│
└──────────┘    └──────────────┘    └────────────────┘
                      │
                      ▼
               ┌──────────────┐
               │  redirect()   │
               │ (next/nav)   │
               └──────────────┘

┌──────────┐    ┌──────────────┐    ┌────────────────┐
│  Server  │───▶│  cookies()   │───▶│ getSessionUserId│
│ Page     │    │ (next/headers)│    │ (lib/auth.ts)  │
└──────────┘    └──────────────┘    └────────────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  base64 decode│
                                    │  + JSON.parse │
                                    └──────────────┘
```

---

## Directory Structure

```
markdev/
├── actions/
│   └── index.ts              # Server Actions (login, logout)
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/page.tsx    # Admin dashboard
│   │       ├── login/
│   │       │   ├── login-form.tsx    # Client component
│   │       │   └── page.tsx          # Login page
│   │       └── layout.tsx
│   ├── (public)/
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── layout.tsx         # <main> wrapper
│   │   └── page.tsx           # Home (Coming Soon)
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx             # Root layout
│   └── not-found.tsx
├── lib/
│   ├── auth.ts                # Session parsing helpers
│   └── envConfig.ts           # Environment config
├── proxy.ts                   # Middleware (multi-host routing + auth guard)
├── public/
│   ├── bg.jpeg
│   ├── fonts/menseal-regular.ttf
│   └── markDevelopersLogo.png
├── .env                       # Public/Admin host config
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── vitest.config.ts
└── package.json
```

---

## State Management (Planned / Scaffolded)

| Layer | Library | Purpose |
|---|---|---|
| Server State | TanStack React Query | API data fetching / caching |
| Client State | Zustand | Lightweight local state |
| Forms | react-hook-form + Zod | Complex form validation |
| Server Mutations | Next.js Server Actions | Login, logout, data mutations |

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16.2.10 (App Router) |
| UI Library | React 19.2.4 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript (strict) |
| Auth | Cookie-based (base64 session) |
| Linting | ESLint 9 + next/core-web-vitals |
| Testing | Vitest 4 + Testing Library + Playwright |
