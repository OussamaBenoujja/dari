import { Request, Response } from "express";
import NotificationService from "../services/notification.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";

type AuthenticatedRequest = Request & { user?: KeycloakTokenPayload };

class NotificationController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }

  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const result = await NotificationService.listForUser(user.id, Number(req.query.limit) || 20);
      res.status(200).json({ success: true, ...result });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { notificationId } = req.body ?? {};
      if (!notificationId) {
        res.status(400).json({ success: false, message: "notificationId is required" });
        return;
      }
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const notification = await NotificationService.markAsRead(notificationId, user.id);
      res.status(200).json({ success: true, notification });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      await NotificationService.markAllRead(user.id);
      res.status(200).json({ success: true });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default NotificationController;
