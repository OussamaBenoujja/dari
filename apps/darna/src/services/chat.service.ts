import { Types } from "mongoose";
import Conversation from "../models/conversation";
import Message from "../models/message";
import RealEstate from "../models/real-estate";
import { ServiceError } from "./realEstate.service";

interface SendMessageOptions {
  conversationId?: string;
  listingId?: string;
  participants?: string[];
  senderId: string;
  content?: string;
  type?: "text" | "image" | "file" | "system";
  attachments?: Array<{
    url: string;
    type?: string;
    name?: string;
    size?: number;
    key?: string;
    thumbnailUrl?: string;
    contentType?: string;
    originalName?: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

interface MarkReadOptions {
  conversationId: string;
  userId: string;
  messageIds?: string[];
}

const toObjectId = (value: string | Types.ObjectId | undefined | null) => {
  if (!value) {
    return undefined;
  }
  return typeof value === "string" ? new Types.ObjectId(value) : value;
};

const buildParticipantHash = (participantIds: Types.ObjectId[], listingId?: Types.ObjectId) => {
  const sorted = participantIds.map((id) => id.toString()).sort();
  const base = sorted.join(":");
  return listingId ? `${base}#${listingId.toString()}` : base;
};

class ChatService {
  private static async ensureConversation(options: {
    conversationId?: string;
    listingId?: string;
    participants?: string[];
    senderId: string;
  }) {
    const { conversationId, listingId, participants, senderId } = options;

    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new ServiceError("Conversation not found", 404);
      }
      const isParticipant = conversation.participants.some((participant) => participant.toString() === senderId);
      if (!isParticipant) {
        throw new ServiceError("You are not part of this conversation", 403);
      }
      return conversation;
    }

    if (!participants || participants.length < 1) {
      throw new ServiceError("At least one other participant is required", 400);
    }

    const participantIds = Array.from(new Set([senderId, ...participants])).map((id) => new Types.ObjectId(id));
    if (participantIds.length < 2) {
      throw new ServiceError("Conversation must involve at least two users", 400);
    }

    const listingObjectId = toObjectId(listingId ?? undefined);
    if (listingObjectId) {
      const listing = await RealEstate.findById(listingObjectId, { _id: 1 });
      if (!listing) {
        throw new ServiceError("Listing not found", 404);
      }
    }

    const participantHash = buildParticipantHash(participantIds, listingObjectId);
    const existing = await Conversation.findOne({ participantHash, listing: listingObjectId ?? null });

    if (existing) {
      return existing;
    }

    const conversation = await Conversation.create({
      participants: participantIds,
      participantHash,
      listing: listingObjectId ?? undefined,
      createdBy: new Types.ObjectId(senderId),
    });

    return conversation;
  }

  static async sendMessage(options: SendMessageOptions) {
    const { senderId, content, type = "text", attachments = [], metadata } = options;
    const conversation = await this.ensureConversation(options);

    if (!content && attachments.length === 0) {
      throw new ServiceError("Message content or attachment is required", 400);
    }

    const normalizedAttachments = attachments.map((attachment) => {
      const inferredType = attachment.contentType?.startsWith("image/")
        ? "image"
        : attachment.contentType?.startsWith("video/")
          ? "video"
          : attachment.contentType?.startsWith("application/")
            ? "document"
            : "other";

      return {
        url: attachment.url,
        type: attachment.type ?? inferredType,
        name: attachment.name ?? attachment.originalName,
        size: attachment.size,
        key: attachment.key,
        thumbnailUrl: attachment.thumbnailUrl,
        contentType: attachment.contentType,
        metadata: {
          ...attachment.metadata,
          originalName: attachment.originalName,
        },
      };
    });

    const message = await Message.create({
      conversation: conversation._id,
      sender: new Types.ObjectId(senderId),
      type,
      content,
      attachments: normalizedAttachments,
      metadata,
      deliveredAt: new Date(),
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessageAt: message.createdAt,
      lastMessage: message._id,
    });

    const populatedMessage = await message.populate([
      { path: "sender", select: "firstName lastName email subscriptionTier" },
      { path: "conversation", select: "participants listing" },
    ]);

    return populatedMessage;
  }

  static async getConversationById(conversationId: string, userId: string) {
    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName email subscriptionTier")
      .populate("listing", "title price availability visibilityTier");

    if (!conversation) {
      throw new ServiceError("Conversation not found", 404);
    }

    const isParticipant = conversation.participants.some((participant: any) => participant._id?.toString() === userId);
    if (!isParticipant) {
      throw new ServiceError("You are not part of this conversation", 403);
    }

    return conversation;
  }

  static async listConversations(userId: string, limit = 20) {
    return Conversation.find({ participants: new Types.ObjectId(userId) })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(limit)
      .populate("participants", "firstName lastName email subscriptionTier")
      .populate("lastMessage")
      .populate("listing", "title price availability visibilityTier");
  }

  static async getMessages(conversationId: string, userId: string, limit = 50) {
    await this.getConversationById(conversationId, userId);
    return Message.find({ conversation: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "firstName lastName email subscriptionTier")
      .then((messages) => messages.reverse());
  }

  static async markMessagesRead({ conversationId, userId, messageIds }: MarkReadOptions) {
    const conversation = await this.getConversationById(conversationId, userId);
    const userObjectId = new Types.ObjectId(userId);
    const filter: Record<string, unknown> = {
      conversation: conversation._id,
      sender: { $ne: userObjectId },
    };

    if (messageIds && messageIds.length > 0) {
      filter._id = { $in: messageIds.map((id) => new Types.ObjectId(id)) };
    }

    const targetMessages = await Message.find(filter, { _id: 1 });
    if (targetMessages.length === 0) {
      return { messageIds: [], readAt: new Date() };
    }

    const readAt = new Date();
    await Message.updateMany(filter, { $pull: { readBy: { user: userObjectId } } });
    await Message.updateMany(filter, { $push: { readBy: { user: userObjectId, readAt } } });

    return {
      messageIds: targetMessages.map((doc) => doc._id.toString()),
      readAt,
    };
  }

  static async getUnreadCount(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const conversations = await Conversation.find({ participants: userObjectId }, { _id: 1 });
    if (conversations.length === 0) {
      return 0;
    }
    return Message.countDocuments({
      conversation: { $in: conversations.map((doc) => doc._id) },
      sender: { $ne: userObjectId },
      readBy: { $not: { $elemMatch: { user: userObjectId } } },
    });
  }
}

export default ChatService;
