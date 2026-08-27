import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const uploadsRoot = path.join(process.cwd(), "public", "uploads");

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_NAME &&
      process.env.CLOUDINARY_KEY &&
      process.env.CLOUDINARY_SECRET,
  );
}

export async function saveUpload(file: {
  filename: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
}): Promise<{ url: string; provider: "local" | "cloudinary" }> {
  const ext = path.extname(file.filename || "").toLowerCase() || ".bin";
  const safeName = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

  if (cloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });

    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "tiger-wear", resource_type: "auto" },
        (err, result) => {
          if (err || !result?.secure_url) reject(err || new Error("Upload failed"));
          else resolve(result.secure_url);
        },
      );
      file.file.pipe(stream);
    });
    return { url, provider: "cloudinary" };
  }

  await mkdir(uploadsRoot, { recursive: true });
  const dest = path.join(uploadsRoot, safeName);
  await pipeline(file.file, createWriteStream(dest));
  return { url: `/uploads/${safeName}`, provider: "local" };
}
