import { Request, Response } from "express";
import FinancingService from "../services/financing.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";

type AuthenticatedRequest = Request & { user?: KeycloakTokenPayload };

class FinancingController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }

  static listBanks(_req: AuthenticatedRequest, res: Response) {
    res.status(200).json({ success: true, data: FinancingService.listBanks() });
  }

  static simulate(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount, downPayment, termMonths, annualRate } = req.body ?? {};
      if (!amount || !termMonths || !annualRate) {
        res.status(400).json({ success: false, message: "amount, termMonths and annualRate are required" });
        return;
      }
      const result = FinancingService.simulate({ amount, downPayment, termMonths, annualRate });
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async apply(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const { amount, downPayment, termMonths, annualRate, bankCode, listingId, leadId } = req.body ?? {};
      if (!amount || !termMonths || !annualRate || !bankCode) {
        res.status(400).json({ success: false, message: "amount, termMonths, annualRate and bankCode are required" });
        return;
      }
      const application = await FinancingService.createApplication({
        amount,
        downPayment,
        termMonths,
        annualRate,
        bankCode,
        listingId,
        leadId,
        userId: user.id,
      });
      res.status(201).json({ success: true, data: application });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async listApplications(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const applications = await FinancingService.listApplications(user.id);
      res.status(200).json({ success: true, data: applications });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async proposeTirelire(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, contributionAmount, contributionInterval } = req.body ?? {};
      if (!name || !contributionAmount || !contributionInterval) {
        res.status(400).json({ success: false, message: "name, contributionAmount and contributionInterval are required" });
        return;
      }
      const result = await FinancingService.proposeTirelireGroup({ name, contributionAmount, contributionInterval });
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default FinancingController;
