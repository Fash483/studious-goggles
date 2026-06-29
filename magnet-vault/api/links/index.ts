import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getSql, rowToLink, sendJson } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const sql = getSql();

    if (req.method === "GET") {
      const rows = await sql`SELECT id, title, magnet, created_at FROM links ORDER BY created_at DESC LIMIT 10000`;
      return sendJson(res, 200, { list: rows.map(rowToLink) });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const title = String(body.title ?? "").slice(0, 1000);
      const magnet = String(body.magnet ?? "").slice(0, 4000);
      if (!magnet) return sendJson(res, 400, { error: "magnet required" });
      const rows = await sql`
        INSERT INTO links (title, magnet) VALUES (${title}, ${magnet})
        RETURNING id, title, magnet, created_at
      `;
      return sendJson(res, 201, rowToLink(rows[0]));
    }

    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (e: any) {
    return sendJson(res, 500, { error: e?.message || "Server error" });
  }
}
