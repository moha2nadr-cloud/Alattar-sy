import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cloudinary } from "../src/lib/cloudinary.js";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const file: string | undefined = body?.file;
    const folder: string = body?.folder || "herbal-shop";
    if (!file || !file.startsWith("data:")) return res.status(400).json({ error: "Invalid file" });
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
      format: "webp",
      transformation: [{ width: 1200, crop: "limit", fetch_format: "webp", quality: "auto" }],
    });
    return res.status(200).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
}
