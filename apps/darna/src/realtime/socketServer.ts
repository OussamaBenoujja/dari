import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyKeycloakToken } from "../middlewares/kcJwt";
import UserService, { KeycloakTokenPayload } from "../services/user.service";
import ChatService from "../services/chat.service";
import NotificationService from "../services/notification.service";
import { registerSocketServer, emitToUsers } from "./gateway";

type SocketWithAuth = Socket & {
  data: {
    userId?: string;
    tokenPayload?: KeycloakTokenPayload;
  };
};

const onlineUsers = new Map<string, Set<string>>();

const extractToken = (socket: SocketWithAuth): string | undefined => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }
  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === "string" && queryToken.length > 0) {
    return queryToken;
  }
  if (Array.isArray(queryToken) && queryToken.length > 0) {
    return queryToken[0];
  }
  return undefined;
};

const addConnection = (userId: string, socketId: string) => {
  const existing = onlineUsers.get(userId) ?? new Set<string>();
  const wasOffline = existing.size === 0;
  existing.add(socketId);
  onlineUsers.set(userId, existing);
  return wasOffline;
};

const removeConnection = (userId: string, socketId: string) => {
  const existing = onlineUsers.get(userId);
  if (!existing) {
    return true;
  }
  existing.delete(socketId);
  if (existing.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  onlineUsers.set(userId, existing);
  return false;
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const acknowledge = (callback: unknown, payload: unknown) => {
  if (typeof callback === "function") {
    try {
      (callback as (response: unknown) => void)(payload);
    } catch (_) {
      // ignore ack errors
    }
  }
};

const bootstrapClient = async (socket: SocketWithAuth, userId: string) => {
  const [notifications, unreadMessages] = await Promise.all([
    NotificationService.listForUser(userId, 20),
    ChatService.getUnreadCount(userId),
  ]);

  socket.emit("realtime:bootstrap", {
    onlineUsers: getOnlineUserIds(),
    notifications: notifications.notifications,
    notificationUnreadCount: notifications.unreadCount,
    unreadMessages,
  });
};

export const initSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN?.split(",") ?? ["*"],
      methods: ["GET", "POST"],
    },
  });

  registerSocketServer(io);

  io.use(async (socket: SocketWithAuth, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        throw new Error("Unauthorized");
      }
      const payload = await verifyKeycloakToken(token);
      const user = await UserService.findOrCreateByKeycloakPayload(payload);
      socket.data.userId = user.id;
      socket.data.tokenPayload = payload;
      socket.join(`user:${user.id}`);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: SocketWithAuth) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    const wentOnline = addConnection(userId, socket.id);
    if (wentOnline) {
      socket.broadcast.emit("presence:status", { userId, status: "online" });
    }

    void bootstrapClient(socket, userId);

    socket.on("presence:list", (_, callback) => {
      acknowledge(callback, { ok: true, users: getOnlineUserIds() });
    });

    socket.on("chat:message", async (payload: any, callback) => {
      try {
        const message = await ChatService.sendMessage({
          conversationId: payload?.conversationId,
          listingId: payload?.listingId,
          participants: payload?.participants,
          senderId: userId,
          content: payload?.content,
          type: payload?.type,
          attachments: payload?.attachments,
          metadata: payload?.metadata,
        });

        const conversationId =
          message.conversation && typeof message.conversation === "object" && "_id" in message.conversation
            ? (message.conversation as any)._id.toString()
            : (message.conversation as any)?.toString?.() ?? payload?.conversationId;

        const conversation = conversationId
          ? await ChatService.getConversationById(conversationId, userId)
          : undefined;

        const participantIds = conversation
          ? conversation.participants.map((participant: any) =>
              participant._id ? participant._id.toString() : participant.toString(),
            )
          : [userId];
        const recipients = participantIds.filter((participantId: string) => participantId !== userId);

        emitToUsers(participantIds, "chat:message", {
          message,
          conversation,
          conversationId,
        });

        if (recipients.length > 0) {
          await NotificationService.notifyMessageRecipients(recipients, {
            conversationId,
            messageId: message._id.toString(),
            senderId: userId,
            content: message.content,
          });
        }

        acknowledge(callback, { ok: true, message });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send message";
        acknowledge(callback, { ok: false, error: message });
      }
    });

    socket.on("chat:read", async (payload: any, callback) => {
      try {
        const result = await ChatService.markMessagesRead({
          conversationId: payload?.conversationId,
          userId,
          messageIds: payload?.messageIds,
        });

        const conversation = await ChatService.getConversationById(payload?.conversationId, userId);
        const participants = conversation.participants.map((participant: any) =>
          participant._id ? participant._id.toString() : participant.toString(),
        );

        emitToUsers(participants, "chat:read", {
          conversationId: payload?.conversationId,
          userId,
          messageIds: result.messageIds,
          readAt: result.readAt,
        });

        acknowledge(callback, { ok: true, result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to mark messages as read";
        acknowledge(callback, { ok: false, error: message });
      }
    });

    socket.on("notification:mark-read", async (payload: any, callback) => {
      try {
        const notification = await NotificationService.markAsRead(payload?.notificationId, userId);
        acknowledge(callback, { ok: true, notification });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update notification";
        acknowledge(callback, { ok: false, error: message });
      }
    });

    socket.on("notification:mark-all-read", async (_, callback) => {
      try {
        await NotificationService.markAllRead(userId);
        acknowledge(callback, { ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update notifications";
        acknowledge(callback, { ok: false, error: message });
      }
    });

    socket.on("disconnect", () => {
      const wentOffline = removeConnection(userId, socket.id);
      if (wentOffline) {
        socket.broadcast.emit("presence:status", { userId, status: "offline" });
      }
    });
  });

  return io;
};
