import { Router } from "express";
import { kcProtect } from "../middlewares/kcJwt";
import AdminController from "../controllers/admin.controller";

const router = Router();

router.get("/metrics", kcProtect, AdminController.metrics);
router.post("/notifications/broadcast", kcProtect, AdminController.broadcastNotification);
router.post("/subscriptions/process-renewals", kcProtect, AdminController.processSubscriptionRenewals);

export default router;
