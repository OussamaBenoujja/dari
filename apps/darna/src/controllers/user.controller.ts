import type { Express, Request, Response } from "express";
import MediaService from "../services/media.service";
import UserService, { type KeycloakTokenPayload } from "../services/user.service";

class UserController {
  private static handleError(res: Response, error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process request";
    res.status(500).json({ success: false, message });
  }

  private static extractTokenPayload(req: Request): KeycloakTokenPayload {
    return ((req as Request & { user?: unknown }).user ?? {}) as KeycloakTokenPayload;
  }

  private static getUploadedFile(req: Request): Express.Multer.File | undefined {
    return (req as Request & { file?: Express.Multer.File }).file;
  }

  static async me(req: Request, res: Response) {
    try {
      const tokenPayload = this.extractTokenPayload(req);
      const user = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
      const plainUser = typeof user.toJSON === "function" ? user.toJSON() : user;
      res.status(200).json({ success: true, data: plainUser });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async uploadProfileImage(req: Request, res: Response) {
    try {
      const file = this.getUploadedFile(req);
      if (!file) {
        res.status(400).json({ success: false, message: "No file provided" });
        return;
      }

      const tokenPayload = this.extractTokenPayload(req);
      const user = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
      const previousMedia = user.profileImage;
      const uploadResult = await MediaService.uploadUserImage(String(user._id), file, "profile");

      user.profileImage = { ...uploadResult, uploadedAt: new Date() } as typeof user.profileImage;

      try {
        await user.save();
      } catch (saveError) {
        await MediaService.deleteUserMedia(uploadResult);
        throw saveError;
      }

      if (previousMedia) {
        try {
          await MediaService.deleteUserMedia(previousMedia);
        } catch (cleanupError) {
          // Swallow cleanup errors to avoid failing the user-facing request.
          console.error("Failed to remove previous profile image from storage", cleanupError);
        }
      }

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        data: { profileImage: user.profileImage },
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async uploadBannerImage(req: Request, res: Response) {
    try {
      const file = this.getUploadedFile(req);
      if (!file) {
        res.status(400).json({ success: false, message: "No file provided" });
        return;
      }

      const tokenPayload = this.extractTokenPayload(req);
      const user = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
      const previousMedia = user.bannerImage;
      const uploadResult = await MediaService.uploadUserImage(String(user._id), file, "banner");

      user.bannerImage = { ...uploadResult, uploadedAt: new Date() } as typeof user.bannerImage;

      try {
        await user.save();
      } catch (saveError) {
        await MediaService.deleteUserMedia(uploadResult);
        throw saveError;
      }

      if (previousMedia) {
        try {
          await MediaService.deleteUserMedia(previousMedia);
        } catch (cleanupError) {
          console.error("Failed to remove previous banner image from storage", cleanupError);
        }
      }

      res.status(200).json({
        success: true,
        message: "Banner image updated successfully",
        data: { bannerImage: user.bannerImage },
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default UserController;
