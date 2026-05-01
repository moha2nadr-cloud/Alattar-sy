import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cloudinary } from "../src/lib/cloudinary";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const file: string | undefined = body?.file;
    const folder: string = body?.folder || "herbal-shop";
    if (!file || typeof file !== "string" || !file.startsWith("data:")) {
      return res.status(400).json({ error: "Missing or invalid file (expected data URL)" });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
      format: "webp",
      transformation: [{ fetch_format: "webp", quality: "auto" }],
    });

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return res.status(500).json({ error: message });
  }
}
