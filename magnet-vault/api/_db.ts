import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set. Check your .env or Vercel project settings.");
  return neon(url);
}

// CREATE TABLE IF NOT EXISTS is idempotent — safe to run on every cold start.
// Do not cache with a module-level flag: Vercel serverless may spin up a fresh
// process at any time, so the flag gives false safety while hiding schema errors.
export async function ensureSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS links (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      magnet TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(body));
}

export function rowToLink(r: any) {
  return {
    id: String(r.id),
    title: r.title ?? "",
    magnet: r.magnet ?? "",
    created_date: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}
