import { Client } from "minio";
import {
  MINIO_ACCESS_KEY,
  MINIO_BUCKET,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_PUBLIC_BASE_URL,
  MINIO_SECRET_KEY,
  MINIO_USE_SSL,
} from "../config/minio";

const client = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

class MinioService {
  private static bucketReady = false;

  private static async ensureBucket() {
    if (this.bucketReady) {
      return;
    }
    try {
      const exists = await client.bucketExists(MINIO_BUCKET);
      if (!exists) {
        await client.makeBucket(MINIO_BUCKET, "");
      }
      this.bucketReady = true;
    } catch (error: unknown) {
      this.bucketReady = false;
      throw error;
    }
  }

  static async putObject(key: string, body: Buffer, contentType: string) {
    await this.ensureBucket();
    await client.putObject(MINIO_BUCKET, key, body, body.length, {
      "Content-Type": contentType,
    });
  }

  static async removeObjects(keys: string[]) {
    await this.ensureBucket();
    const sanitized = keys.filter((key): key is string => Boolean(key));
    if (sanitized.length === 0) {
      return;
    }
    await client.removeObjects(MINIO_BUCKET, sanitized);
  }

  static getPublicUrl(key: string) {
    return `${MINIO_PUBLIC_BASE_URL}/${key}`;
  }
}

export default MinioService;
