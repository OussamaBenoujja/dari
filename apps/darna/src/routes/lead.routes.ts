import { Router } from "express";
import { kcProtect } from "../middlewares/kcJwt";
import LeadController from "../controllers/lead.controller";

const router = Router();

router.post("/", kcProtect, LeadController.create);
router.get("/buyer", kcProtect, LeadController.listBuyerLeads);
router.get("/owner", kcProtect, LeadController.listOwnerLeads);
router.patch("/:leadId/status", kcProtect, LeadController.updateStatus);

export default router;
