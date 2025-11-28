import { Router } from "express";
import { kcProtect } from "../middlewares/kcJwt";
import ChatController from "../controllers/chat.controller";
import { uploadChatAttachment } from "../middlewares/upload";

const router = Router();

router.get("/conversations", kcProtect, ChatController.listConversations);
router.get("/conversations/:conversationId", kcProtect, ChatController.getConversation);
router.get("/conversations/:conversationId/messages", kcProtect, ChatController.getMessages);
router.post("/conversations/:conversationId/read", kcProtect, ChatController.markRead);
router.post("/attachments", kcProtect, uploadChatAttachment, ChatController.uploadAttachment);

export default router;
