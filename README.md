# Veyra

**Give us the problem. We'll figure out what to do next.**

Veyra is an AI business investigation and decision platform. This repository holds the
first frontend version: the complete product journey running on mock data. It has no
backend, AI, auth or database yet.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · lucide-react · Recharts

## Structure

```
app/            Routes. (app)/ holds the signed-in product screens.
components/     UI by area: ui/, brand/, marketing/, … (dev/ = temporary route stubs)
lib/types.ts    Domain types — the contract between UI and data.
lib/data/       Data access layer. Screens read data only through here.
lib/routes.ts   Central list of app paths.
mocks/          Mock data used by lib/data until the backend exists.
```

To connect the real backend, reimplement the functions in `lib/data/` so they call the
API. Components shouldn't need to change.
