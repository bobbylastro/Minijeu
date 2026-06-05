import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(key: string, body: Blob, contentType: string): Promise<void> {
  const buffer = Buffer.from(await body.arrayBuffer());
  await r2Client.send(new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME!,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));
}

export async function deleteR2Object(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    key,
  }));
}

// Extract R2 key from a public URL, e.g. https://cdn.example.com/valorant/clip.mp4 → "valorant/clip.mp4"
export function urlToR2Key(url: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base || !url.startsWith(base)) return null;
  return url.slice(base.length).replace(/^\//, "");
}
