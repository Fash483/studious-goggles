import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getSql, rowToLink, sendJson } from "../_db";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req: VercelRequest): unknown {
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body || "null"); } catch { return null; }
  }
  return req.body ?? null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === "POST") {
      const raw = parseBody(req);
      const records: Array<{ title?: string; magnet?: string }> = Array.isArray(raw) ? raw : [];
      if (!records.length) return sendJson(res, 200, { list: [] });
      const titles = records.map((r) => String(r.title ?? "").slice(0, 1000));
      const magnets = records.map((r) => String(r.magnet ?? "").slice(0, 4000));
      const rows = await sql`
        INSERT INTO links (title, magnet)
        SELECT * FROM UNNEST(${titles}::text[], ${magnets}::text[])
        RETURNING id, title, magnet, created_at
      `;
      return sendJson(res, 201, { list: rows.map(rowToLink) });
    }

    if (req.method === "DELETE") {
      const raw = parseBody(req);
      const rawObj = raw !== null && !Array.isArray(raw) && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const ids: Array<number | string> = Array.isArray(rawObj.ids) ? rawObj.ids : [];
      const numIds = ids.map((v) => Number(v)).filter((n) => Number.isFinite(n));
      if (!numIds.length) return sendJson(res, 200, { ok: true, deleted: 0 });
      await sql`DELETE FROM links WHERE id = ANY(${numIds}::bigint[])`;
      return sendJson(res, 200, { ok: true, deleted: numIds.length });
    }

    res.setHeader("Allow", "POST, DELETE, OPTIONS");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (e: any) {
    return sendJson(res, 500, { error: e?.message || "Server error" });
  }
}
