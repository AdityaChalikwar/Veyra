# Veyra

**Give us the problem. We'll figure out what to do next.**

Veyra is an AI product discovery system: it helps product teams understand which problem
to solve before deciding what to build. The full product journey is built; the backend is
being connected milestone by milestone (see `docs/backend-plan.md`).

**Real today:** sign-up / log-in / password reset (Supabase Auth), protected app pages,
the company profile and business context, and investigations — problem, context,
clarifying questions and answers, and plan, and uploaded CSV data turned into evidence
(Supabase Postgres, Storage and Row Level Security).
**Still mock data:** analysis (findings, hypotheses, opportunities…), shown
through the sample investigation every workspace starts with.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev                  # http://localhost:3000
```

### Supabase setup

- Database schema: `supabase/migrations/` (apply in order).
- Auth → URL Configuration: set **Site URL** to where the app runs, and add
  `<your site>/auth/callback` to **Redirect URLs**, so sign-up confirmation links work.
- Auth → Providers → Google: optional. The Google button works once it's enabled.

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth, Postgres, RLS) · lucide-react · Recharts

## Structure

```
app/            Routes. (app)/ holds the signed-in product screens.
components/     UI by area: ui/, brand/, marketing/, … (dev/ = temporary route stubs)
lib/types.ts    Domain types — the contract between UI and data.
lib/data/       Data access layer. Screens read data only through here.
lib/auth.ts     Who is signed in and their workspace (the access check for pages and actions).
lib/supabase/   Supabase clients (browser, server, proxy) and generated database types.
proxy.ts        Refreshes the Supabase session cookie on every request.
lib/routes.ts   Central list of app paths.
mocks/          Mock data used by lib/data for the parts not yet on the backend.
supabase/       Database migrations.
```

Screens read data only through `lib/data/`; moving an area to the backend means
reimplementing those functions, not changing components. See `docs/backend-plan.md`.
