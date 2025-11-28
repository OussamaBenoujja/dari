import { Request, Response } from "express";
import SubscriptionService from "../services/subscription.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";

type AuthenticatedRequest = Request & { user?: unknown };

class SubscriptionController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }

  static async listPlans(_req: Request, res: Response) {
    try {
      const plans = await SubscriptionService.listPlans();
      res.status(200).json({ success: true, data: plans });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async getCurrent(req: AuthenticatedRequest, res: Response) {
    try {
  const tokenPayload = (req.user ?? {}) as KeycloakTokenPayload;
      const user = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
      const subscription = await SubscriptionService.getUserSubscription(user.id);
      res.status(200).json({
        success: true,
        data: {
          user,
          subscription,
        },
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async assignPlan(req: AuthenticatedRequest, res: Response) {
    try {
      const { planCode } = req.body ?? {};
      if (!planCode || typeof planCode !== "string") {
        res.status(400).json({ success: false, message: "planCode is required" });
        return;
      }
  const tokenPayload = (req.user ?? {}) as KeycloakTokenPayload;
      const user = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
      const subscription = await SubscriptionService.assignPlanToUser(user.id, planCode);
      res.status(200).json({ success: true, data: subscription });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default SubscriptionController;
