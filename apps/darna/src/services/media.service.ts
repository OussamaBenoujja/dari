import type { Express } from "express";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import MinioService from "./minio.service";

interface MediaUploadResult {
  key: string;
  url: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  contentType: string;
  size: number;
  originalName?: string;
}

class MediaService {
  private static async removeMediaObjects(media: { key?: string | null; thumbnailKey?: string | null }) {
    const keysToRemove = [media.key, media.thumbnailKey].filter((key): key is string => Boolean(key));
    if (keysToRemove.length === 0) {
      return;
    }
    await MinioService.removeObjects(keysToRemove);
  }

  private static resolveExtension(mimeType: string, originalName: string) {
    const ext = path.extname(originalName);
    if (ext) {
      return ext.toLowerCase();
    }
    if (mimeType === "image/jpeg") return ".jpg";
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    if (mimeType === "image/gif") return ".gif";
    if (mimeType === "video/mp4") return ".mp4";
    if (mimeType === "video/quicktime") return ".mov";
    return "";
  }

  static async uploadRealEstateMedia(realEstateId: string, file: Express.Multer.File): Promise<MediaUploadResult> {
    const extension = this.resolveExtension(file.mimetype, file.originalname);
    const baseKey = `real-estate/${realEstateId}/${uuidv4()}`;
    const objectKey = `${baseKey}${extension}`;

    await MinioService.putObject(objectKey, file.buffer, file.mimetype);

    let thumbnailKey: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file.mimetype.startsWith("image/")) {
      try {
        const thumbnailBuffer = await sharp(file.buffer)
          .resize({ width: 720, height: 720, fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();
        thumbnailKey = `${baseKey}_thumb.jpg`;
        await MinioService.putObject(thumbnailKey, thumbnailBuffer, "image/jpeg");
        thumbnailUrl = MinioService.getPublicUrl(thumbnailKey);
      } catch (error: unknown) {
        // Continue even if thumbnail generation fails
      }
    }

    return {
      key: objectKey,
      url: MinioService.getPublicUrl(objectKey),
      thumbnailKey,
      thumbnailUrl,
      contentType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  static async deleteRealEstateMedia(media: { key?: string | null; thumbnailKey?: string | null }) {
    await this.removeMediaObjects(media);
  }

  static async uploadUserImage(userId: string, file: Express.Multer.File, variant: "profile" | "banner"): Promise<MediaUploadResult> {
    const extension = this.resolveExtension(file.mimetype, file.originalname) || ".jpg";
    const baseKey = `users/${userId}/${variant}/${uuidv4()}`;
    const objectKey = `${baseKey}${extension}`;

    await MinioService.putObject(objectKey, file.buffer, file.mimetype);

    let thumbnailKey: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file.mimetype.startsWith("image/")) {
      const isProfile = variant === "profile";
      const resizeOptions = isProfile
        ? { width: 512, height: 512, fit: "cover" as const }
        : { width: 1600, height: 900, fit: "inside" as const };

      try {
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(resizeOptions)
          .jpeg({ quality: 85 })
          .toBuffer();
        thumbnailKey = `${baseKey}_thumb.jpg`;
        await MinioService.putObject(thumbnailKey, thumbnailBuffer, "image/jpeg");
        thumbnailUrl = MinioService.getPublicUrl(thumbnailKey);
      } catch (error: unknown) {
        // Continue even if thumbnail generation fails
      }
    }

    return {
      key: objectKey,
      url: MinioService.getPublicUrl(objectKey),
      thumbnailKey,
      thumbnailUrl,
      contentType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  static async deleteUserMedia(media: { key?: string | null; thumbnailKey?: string | null }) {
    await this.removeMediaObjects(media);
  }

  static async uploadChatAttachment(options: {
    ownerId: string;
    file: Express.Multer.File;
    conversationId?: string;
  }): Promise<MediaUploadResult> {
    const { ownerId, file, conversationId } = options;
    const extension = this.resolveExtension(file.mimetype, file.originalname) || "";
    const forConversation = conversationId ? `conversations/${conversationId}` : `users/${ownerId}`;
    const baseKey = `chat/${forConversation}/${uuidv4()}`;
    const objectKey = `${baseKey}${extension}`;

    await MinioService.putObject(objectKey, file.buffer, file.mimetype);

    let thumbnailKey: string | undefined;
    let thumbnailUrl: string | undefined;

    if (file.mimetype.startsWith("image/")) {
      try {
        const thumbnailBuffer = await sharp(file.buffer)
          .resize({ width: 1024, height: 1024, fit: "inside" })
          .jpeg({ quality: 80 })
          .toBuffer();
        thumbnailKey = `${baseKey}_thumb.jpg`;
        await MinioService.putObject(thumbnailKey, thumbnailBuffer, "image/jpeg");
        thumbnailUrl = MinioService.getPublicUrl(thumbnailKey);
      } catch (error: unknown) {
        // Ignore thumbnail errors for chat attachments
      }
    }

    return {
      key: objectKey,
      url: MinioService.getPublicUrl(objectKey),
      thumbnailKey,
      thumbnailUrl,
      contentType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  static async deleteChatAttachment(media: { key?: string | null; thumbnailKey?: string | null }) {
    await this.removeMediaObjects(media);
  }
}

export default MediaService;
