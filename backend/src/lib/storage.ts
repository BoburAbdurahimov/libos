import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Local-disk storage for development. Swap for Vercel Blob / S3 in production
// — only this function needs to change.
export async function saveImage(
  base64: string,
  mediaType: string
): Promise<string> {
  const ext =
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
      mediaType
    ] ?? "jpg";
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(base64, "base64"));
  return `/uploads/${name}`;
}
