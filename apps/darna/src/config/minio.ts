export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
export const MINIO_PORT = Number(process.env.MINIO_PORT || 9000);
export const MINIO_USE_SSL = String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true";
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin123";
export const MINIO_BUCKET = process.env.MINIO_BUCKET || "darna-media";
const defaultBaseUrl = `${MINIO_USE_SSL ? "https" : "http"}://${MINIO_ENDPOINT}:${MINIO_PORT}/${MINIO_BUCKET}`;
export const MINIO_PUBLIC_BASE_URL = (process.env.MINIO_PUBLIC_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
