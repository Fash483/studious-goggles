import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

function parseBody(req: VercelRequest): unknown {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "null"); } catch { return null; }
  }
  return req.body ?? null;
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const sql = neon(url);

    if (req.method === "POST") {
      const raw = parseBody(req);
      const records: Array<{ title?: string; magnet?: string }> = Array.isArray(raw) ? raw : [];
      if (!records.length) return res.status(200).json({ list: [] });
      const titles = records.map((r) => String(r.title ?? "").slice(0, 1000));
      const magnets = records.map((r) => String(r.magnet ?? "").slice(0, 4000));
      const rows = await sql`
        INSERT INTO links (title, magnet)
        SELECT * FROM UNNEST(${titles}::text[], ${magnets}::text[])
        RETURNING id, title, magnet, created_at
      `;
      return res.status(201).json({ list: rows.map(toLink) });
    }
    if (req.method === "DELETE") {
      const raw = parseBody(req);
      const rawObj = raw !== null && !Array.isArray(raw) && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const ids: Array<number | string> = Array.isArray(rawObj.ids) ? rawObj.ids : [];
      const numIds = ids.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      if (!numIds.length) return res.status(200).json({ ok: true, deleted: 0 });
      await sql`DELETE FROM links WHERE id = ANY(${numIds}::bigint[])`;
      return res.status(200).json({ ok: true, deleted: numIds.length });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
