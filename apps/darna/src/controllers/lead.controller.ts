import { Request, Response } from "express";
import LeadService from "../services/lead.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";

type AuthenticatedRequest = Request & { user?: KeycloakTokenPayload };

class LeadController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const { listingId, message, budget, moveInDate } = req.body ?? {};
      if (!listingId) {
        res.status(400).json({ success: false, message: "listingId is required" });
        return;
      }
      const lead = await LeadService.createLead({
        listingId,
        buyerId: user.id,
        message,
        budget,
        moveInDate,
      });
      res.status(201).json({ success: true, data: lead });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async listBuyerLeads(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const leads = await LeadService.listLeadsForBuyer(user.id);
      res.status(200).json({ success: true, data: leads });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async listOwnerLeads(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const leads = await LeadService.listLeadsForOwner(user.id, req.query.status as string | undefined);
      res.status(200).json({ success: true, data: leads });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const { status } = req.body ?? {};
      if (!status) {
        res.status(400).json({ success: false, message: "status is required" });
        return;
      }
      const lead = await LeadService.updateLeadStatus({
        leadId: req.params.leadId,
        ownerId: user.id,
        status,
      });
      res.status(200).json({ success: true, data: lead });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default LeadController;
