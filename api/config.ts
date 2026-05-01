import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, ensureSchema } from "../src/lib/db.js";

const CONFIG_ID = "main";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    if (req.method === "GET") {
      const rows = await sql`SELECT data, updated_at FROM shop_config WHERE id = ${CONFIG_ID}` as Array<{data: unknown, updated_at: string}>;
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ data: rows[0]?.data ?? null, updatedAt: rows[0]?.updated_at ?? null });
    }
    if (req.method === "POST" || req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const data = body?.data;
      if (data === undefined || data === null) return res.status(400).json({ error: "Missing data" });
      const rows = await sql`INSERT INTO shop_config (id, data) VALUES (${CONFIG_ID}, ${JSON.stringify(data)}::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data RETURNING updated_at` as Array<{updated_at: string}>;
      return res.status(200).json({ ok: true, updatedAt: rows[0]?.updated_at ?? null });
    }
    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
}
