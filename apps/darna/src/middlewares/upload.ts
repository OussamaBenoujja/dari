import type { NextFunction, Request, Response } from "express";
import multer, { MulterError, type FileFilterCallback } from "multer";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MEDIA_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  "video/mp4",
  "video/quicktime",
]);

const ATTACHMENT_MIME_TYPES = new Set([
  ...MEDIA_MIME_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
]);

const MAX_SIZE_MB = Number(process.env.MEDIA_MAX_SIZE_MB || 25);

const createUploadHandler = (allowedTypes: Set<string>, fieldName: string) => {
  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_SIZE_MB * 1024 * 1024,
    },
    fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
      if (allowedTypes.has(file.mimetype)) {
        cb(null, true);
        return;
      }
      cb(new Error("Unsupported media type"));
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    uploader.single(fieldName)(req, res, (error: unknown) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof MulterError) {
        const multerError = error as MulterError;
        if (multerError.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ success: false, message: "File exceeds maximum allowed size" });
          return;
        }
        res.status(400).json({ success: false, message: multerError.message });
        return;
      }

      if (error instanceof Error && error.message === "Unsupported media type") {
        res.status(415).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ success: false, message: "Failed to process uploaded file" });
    });
  };
};

export const uploadRealEstateMedia = createUploadHandler(MEDIA_MIME_TYPES, "file");
export const uploadUserImage = createUploadHandler(IMAGE_MIME_TYPES, "file");
export const uploadChatAttachment = createUploadHandler(ATTACHMENT_MIME_TYPES, "file");

export default createUploadHandler;
