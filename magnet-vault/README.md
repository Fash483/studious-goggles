# ✦ Magnet Vault ✦

A React + Vite torrent magnet-link manager, backed by **Neon Postgres** and deployed on **Vercel**. Same-origin API routes — no CORS headaches.

## Quick start

```bash
npm install
cp .env.example .env   # paste your Neon DATABASE_URL
npx vercel dev          # runs frontend + /api together
```

Or run them separately:

```bash
npm run dev             # Vite on :5173 (proxies /api -> :3000)
npx vercel dev          # in another shell, serves /api on :3000
```

The `links` table is created automatically on first request.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add env var `DATABASE_URL` (Neon connection string, `?sslmode=require`).
4. Deploy. Done.

## API

| Method | Route               | Body                          |
| ------ | ------------------- | ----------------------------- |
| GET    | `/api/links`        | —                             |
| POST   | `/api/links`        | `{ title, magnet }`           |
| DELETE | `/api/links/:id`    | —                             |
| POST   | `/api/links/bulk`   | `[ { title, magnet }, ... ]`  |
| DELETE | `/api/links/bulk`   | `{ ids: [1,2,3] }`            |

## What changed vs. the original single-file HTML

- Converted to React + Vite + TypeScript.
- Backend swapped: **NocoDB → Neon Postgres** via Vercel serverless functions. No CORS errors because the API is same-origin.
- More butterflies (24 instead of 15) with richer motion.
- Toast popups and confirmation modals are now mobile-safe: full-width with side padding, `max-width: calc(100vw - 2rem)`, word-wrap enabled, and `confirm()` replaced with an in-app modal that respects viewport insets — no more cut-off text on phones.
