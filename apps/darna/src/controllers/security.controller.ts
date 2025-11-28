import { Request, Response } from "express";
import SecurityService from "../services/security.service";
import PrivacyService from "../services/privacy.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";

type AuthenticatedRequest = Request & { user?: KeycloakTokenPayload };

class SecurityController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }

  static async sendVerificationEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user ?? {};
      const keycloakId = payload.sub;
      if (!keycloakId) {
        res.status(400).json({ success: false, message: "Unable to determine account" });
        return;
      }
      const force = String(req.query.force ?? "false").toLowerCase() === "true";
      const result = await SecurityService.triggerVerificationEmail(keycloakId, force);
      const message = result.forced
        ? "Email marked as verified"
        : "Verification email sent";
      res.status(200).json({ success: true, message, data: result });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async twoFactorStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user ?? {};
      const keycloakId = payload.sub;
      if (!keycloakId) {
        res.status(400).json({ success: false, message: "Unable to determine account" });
        return;
      }
      const status = await SecurityService.twoFactorStatus(keycloakId);
      res.status(200).json({ success: true, data: status });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async enableTwoFactor(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user ?? {};
      const keycloakId = payload.sub;
      if (!keycloakId) {
        res.status(400).json({ success: false, message: "Unable to determine account" });
        return;
      }
      await SecurityService.enableTwoFactor(keycloakId);
      res.status(200).json({
        success: true,
        message: "Two-factor authentication required on next login. Configure TOTP in Keycloak Account Console.",
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async disableTwoFactor(req: AuthenticatedRequest, res: Response) {
    try {
      const payload = req.user ?? {};
      const keycloakId = payload.sub;
      if (!keycloakId) {
        res.status(400).json({ success: false, message: "Unable to determine account" });
        return;
      }
      await SecurityService.disableTwoFactor(keycloakId);
      res.status(200).json({ success: true, message: "Two-factor authentication disabled" });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async exportData(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
  const exportData = await PrivacyService.exportUserData(user.id);
      res.status(200).json({ success: true, data: exportData });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async deleteData(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
  await PrivacyService.deleteUserData(user.id);
      res.status(200).json({ success: true, message: "Account data deletion request completed" });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default SecurityController;
