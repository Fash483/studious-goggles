import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema, getSql, sendJson } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    const sql = getSql();
    const id = Number(req.query.id);
    if (!Number.isFinite(id)) return sendJson(res, 400, { error: "bad id" });

    if (req.method === "DELETE") {
      await sql`DELETE FROM links WHERE id = ${id}`;
      return sendJson(res, 200, { ok: true });
    }
    res.setHeader("Allow", "DELETE");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (e: any) {
    return sendJson(res, 500, { error: e?.message || "Server error" });
  }
}
