import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export const BUCKET = "clinic-uploads";

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );
  return `${process.env.MINIO_PUBLIC_URL}/${BUCKET}/${path}`;
}

export async function deleteFile(path: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }));
}