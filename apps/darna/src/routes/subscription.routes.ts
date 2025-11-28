import { Router } from "express";
import SubscriptionController from "../controllers/subscription.controller";
import { kcProtect } from "../middlewares/kcJwt";

const router = Router();

router.get("/plans", kcProtect, SubscriptionController.listPlans);
router.get("/me", kcProtect, SubscriptionController.getCurrent);
router.post("/assign", kcProtect, SubscriptionController.assignPlan);

export default router;
