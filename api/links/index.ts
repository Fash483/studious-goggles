import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

async function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  await sql`CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    magnet TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

function toLink(r: any) {
  return {
    id: String(r.id),
    title: r.title ?? "",
    magnet: r.magnet ?? "",
    created_date: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = await getDb();
    if (req.method === "GET") {
      const rows = await sql`SELECT id, title, magnet, created_at FROM links ORDER BY created_at DESC LIMIT 10000`;
      return res.status(200).json({ list: rows.map(toLink) });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const title = String(body.title ?? "").slice(0, 1000);
      const magnet = String(body.magnet ?? "").slice(0, 4000);
      if (!magnet) return res.status(400).json({ error: "magnet required" });
      const rows = await sql`INSERT INTO links (title, magnet) VALUES (${title}, ${magnet}) RETURNING id, title, magnet, created_at`;
      return res.status(201).json(toLink(rows[0]));
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
                                 }
