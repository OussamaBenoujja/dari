 import type { Express, Request, Response } from "express";
import ChatService from "../services/chat.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import { ServiceError } from "../services/realEstate.service";
import MediaService from "../services/media.service";

type AuthenticatedRequest = Request & { user?: KeycloakTokenPayload };

class ChatController {
  private static handleError(res: Response, error: unknown) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message });
  }

  static async listConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const conversations = await ChatService.listConversations(user.id, Number(req.query.limit) || 20);
      res.status(200).json({ success: true, data: conversations });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async getConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const conversation = await ChatService.getConversationById(req.params.conversationId, user.id);
      res.status(200).json({ success: true, data: conversation });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const messages = await ChatService.getMessages(req.params.conversationId, user.id, Number(req.query.limit) || 50);
      res.status(200).json({ success: true, data: messages });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageIds } = req.body ?? {};
      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const result = await ChatService.markMessagesRead({
        conversationId: req.params.conversationId,
        userId: user.id,
        messageIds,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }

  static async uploadAttachment(req: AuthenticatedRequest, res: Response) {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        res.status(400).json({ success: false, message: "No file provided" });
        return;
      }

      const user = await UserService.findOrCreateByKeycloakPayload(req.user ?? {});
      const conversationId = (req.body?.conversationId as string | undefined) ?? (req.query.conversationId as string | undefined);

      if (conversationId) {
        await ChatService.getConversationById(conversationId, user.id);
      }

      const upload = await MediaService.uploadChatAttachment({
        ownerId: user.id,
        conversationId,
        file,
      });

      res.status(201).json({
        success: true,
        message: "Attachment uploaded successfully",
        data: {
          attachment: {
            key: upload.key,
            url: upload.url,
            thumbnailUrl: upload.thumbnailUrl,
            contentType: upload.contentType,
            size: upload.size,
            originalName: upload.originalName,
          },
        },
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  }
}

export default ChatController;
