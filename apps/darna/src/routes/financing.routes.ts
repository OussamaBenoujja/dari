import { Router } from "express";
import { kcProtect } from "../middlewares/kcJwt";
import FinancingController from "../controllers/financing.controller";

const router = Router();

router.get("/banks", FinancingController.listBanks);
router.post("/simulate", FinancingController.simulate);
router.post("/applications", kcProtect, FinancingController.apply);
router.get("/applications", kcProtect, FinancingController.listApplications);
router.post("/tirelire/proposal", kcProtect, FinancingController.proposeTirelire);

export default router;
