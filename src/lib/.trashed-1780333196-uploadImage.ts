// Client-side helper that uploads a File to /api/upload (Cloudinary)
// and returns the secure WebP CDN URL.
export async function uploadImage(file: File, folder = "herbal-shop"): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: dataUrl, folder }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
