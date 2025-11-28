import User from "../models/user";
import RealEstate from "../models/real-estate";
import Lead from "../models/lead";
import Subscription from "../models/subscription";
import FinancingApplication from "../models/financing-application";
import NotificationService from "./notification.service";
import SubscriptionService from "./subscription.service";

class AdminService {
  static async getMetrics() {
    const [users, listings, leads, activeSubscriptions, financingApplications, listingByTier] = await Promise.all([
      User.estimatedDocumentCount(),
      RealEstate.estimatedDocumentCount(),
      Lead.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      FinancingApplication.countDocuments(),
      RealEstate.aggregate([
        {
          $group: {
            _id: "$visibilityTier",
            count: { $sum: 1 },
            avgScore: { $avg: "$visibilityScore" },
          },
        },
      ]),
    ]);

    const leadsByStatus = await Lead.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const subscriptionsByTier = await User.aggregate([
      {
        $group: {
          _id: "$subscriptionTier",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      totals: {
        users,
        listings,
        leads,
        activeSubscriptions,
        financingApplications,
      },
      listingsByTier: listingByTier.map((entry) => ({
        tier: entry._id,
        count: entry.count,
        avgScore: entry.avgScore,
      })),
      leadsByStatus: leadsByStatus.map((entry) => ({ status: entry._id, count: entry.count })),
      subscriptionsByTier: subscriptionsByTier.map((entry) => ({ tier: entry._id, count: entry.count })),
    };
  }

  static async broadcastNotification(options: {
    userIds?: string[];
    accountType?: string;
    title: string;
    message: string;
    type: string;
    payload?: Record<string, unknown>;
    channels?: Array<"in-app" | "email">;
    actionUrl?: string;
  }) {
    return NotificationService.broadcast(options);
  }

  static async processSubscriptionRenewals() {
    return SubscriptionService.processRenewalReminders();
  }
}

export default AdminService;
