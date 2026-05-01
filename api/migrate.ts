import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSchema } from "../src/lib/db";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await ensureSchema();
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return res.status(500).json({ error: message });
  }
}
