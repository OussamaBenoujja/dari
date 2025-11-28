import { Router } from "express";
import { kcProtect } from "../middlewares/kcJwt";
import NotificationController from "../controllers/notification.controller";

const router = Router();

router.get("/", kcProtect, NotificationController.list);
router.post("/read", kcProtect, NotificationController.markAsRead);
router.post("/read-all", kcProtect, NotificationController.markAllRead);

export default router;
