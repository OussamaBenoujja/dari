import { Types } from "mongoose";
import Notification from "../models/notification";
import User from "../models/user";
import { emitToUser } from "../realtime/gateway";
import { sendNotificationEmail } from "./email.service";

interface CreateNotificationOptions {
  userId: string | Types.ObjectId;
  type: string;
  title?: string;
  message?: string;
  payload?: Record<string, unknown>;
  channel?: string;
  channels?: Array<"in-app" | "email">;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  emailRecipient?: string;
}

interface BroadcastNotificationOptions {
  userIds?: string[];
  accountType?: string;
  type: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  channels?: Array<"in-app" | "email">;
  actionUrl?: string;
}

class NotificationService {
  static async createNotification(options: CreateNotificationOptions) {
    const { userId, type, title, message, payload, metadata, actionUrl, emailRecipient } = options;
    const channels = options.channels?.length
      ? Array.from(new Set(options.channels))
      : [options.channel ?? "in-app"];

    const includeInApp = channels.includes("in-app");
    const includeEmail = channels.includes("email");

    let notification = null;
    if (includeInApp) {
      notification = await Notification.create({
        user: new Types.ObjectId(userId),
        type,
        title,
        message,
        payload,
        channel: channels[0] ?? "in-app",
        channels,
        deliveredAt: new Date(),
        metadata,
      });

      emitToUser(notification.user.toString(), "notification:new", { notification });
    }

    if (includeEmail) {
      let recipient = emailRecipient;
      if (!recipient) {
        const user = await User.findById(userId, { email: 1 });
        recipient = user?.email ?? undefined;
      }
      if (recipient) {
        await sendNotificationEmail({
          to: recipient,
          title,
          message,
          actionUrl,
          metadata,
        });
      }
    }

    return notification;
  }

  static async listForUser(userId: string, limit = 20) {
    const userObjectId = new Types.ObjectId(userId);
    const notifications = await Notification.find({ user: userObjectId })
      .sort({ createdAt: -1 })
      .limit(limit);
    const unreadCount = await Notification.countDocuments({ user: userObjectId, readAt: { $exists: false } });
    return { notifications, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), user: new Types.ObjectId(userId) },
      { readAt: new Date() },
      { new: true },
    );
    if (notification) {
      emitToUser(userId, "notification:updated", { notification });
    }
    return notification;
  }

  static async markAllRead(userId: string) {
    await Notification.updateMany({ user: new Types.ObjectId(userId), readAt: { $exists: false } }, { readAt: new Date() });
    emitToUser(userId, "notification:bulk-read", {});
  }

  static async notifyMessageRecipients(recipients: string[], payload: Record<string, unknown>) {
    await Promise.all(
      recipients.map((userId) =>
        this.createNotification({
          userId,
          type: "chat.message",
          title: "Nouveau message",
          message: payload?.content as string | undefined,
          payload,
          channels: ["in-app", "email"],
        }),
      ),
    );
  }

  static async broadcast(options: BroadcastNotificationOptions) {
    const { userIds, accountType, type, title, message, payload, actionUrl } = options;
    let recipients: string[] = [];

    if (userIds && userIds.length > 0) {
      recipients = Array.from(new Set(userIds));
    } else if (accountType) {
      const users = await User.find({ accountType }, { _id: 1 }).lean();
      recipients = users.map((user) => user._id.toString());
    } else {
      const users = await User.find({}, { _id: 1 }).lean();
      recipients = users.map((user) => user._id.toString());
    }

    await Promise.all(
      recipients.map((userId) =>
        this.createNotification({
          userId,
          type,
          title,
          message,
          payload,
          actionUrl,
          channels: options.channels?.length ? options.channels : ["in-app"],
        }),
      ),
    );

    return { recipients: recipients.length };
  }
}

export default NotificationService;
