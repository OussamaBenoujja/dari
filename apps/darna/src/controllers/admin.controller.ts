import { Request, Response } from "express";
import AdminService from "../services/admin.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";

type AuthenticatedRequest = Request & { user?: KeycloakTokenPayload };

const ensureAdmin = async (req: AuthenticatedRequest) => {
  const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
  if (user.accountType !== "admin") {
    throw new ServiceError("Admin access required", 403);
  }
  return user;
};

class AdminController {
  static async metrics(req: AuthenticatedRequest, res: Response) {
    try {
      await ensureAdmin(req);
      const metrics = await AdminService.getMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(500).json({ success: false, message });
    }
  }

  static async broadcastNotification(req: AuthenticatedRequest, res: Response) {
    try {
      await ensureAdmin(req);
      const { userIds, accountType, title, message, type, payload, channels, actionUrl } = req.body ?? {};

      if (!title || !message) {
        res.status(400).json({ success: false, message: "title and message are required" });
        return;
      }

      const notificationType = typeof type === "string" && type.trim().length > 0 ? type : "admin.broadcast";
      const resolvedChannels = Array.isArray(channels) && channels.length > 0 ? channels : ["in-app"];

      if (!Array.isArray(resolvedChannels) || resolvedChannels.some((channel) => !["in-app", "email"].includes(channel))) {
        res.status(400).json({ success: false, message: "channels must be an array containing 'in-app' and/or 'email'" });
        return;
      }

      const result = await AdminService.broadcastNotification({
        userIds,
        accountType,
        title,
        message,
        type: notificationType,
        payload,
        channels: resolvedChannels as Array<"in-app" | "email">,
        actionUrl,
      });

      res.status(202).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(500).json({ success: false, message });
    }
  }

  static async processSubscriptionRenewals(req: AuthenticatedRequest, res: Response) {
    try {
      await ensureAdmin(req);
      const result = await AdminService.processSubscriptionRenewals();
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(500).json({ success: false, message });
    }
  }
}

export default AdminController;
