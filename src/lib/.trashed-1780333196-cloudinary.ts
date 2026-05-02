import { v2 as cloudinary } from "cloudinary";

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud || !key || !secret) {
  throw new Error("Cloudinary env vars are not fully set");
}

cloudinary.config({
  cloud_name: cloud,
  api_key: key,
  api_secret: secret,
  secure: true,
});

export { cloudinary };
