import Subscription from "../models/subscription";
import SubscriptionPlan from "../models/subscription-plan";
import User from "../models/user";
import RealEstate from "../models/real-estate";
import NotificationService from "./notification.service";
import { ServiceError } from "./realEstate.service";

const DEFAULT_PLANS = [
  {
    code: "FREE",
    name: "Gratuit",
    description: "Plan de base pour les particuliers avec un référencement standard.",
    price: 0,
    interval: "monthly",
    features: [
      "Publication de 3 annonces actives",
      "Support par email",
    ],
    listingLimit: 3,
    visibilityBoost: 0,
    priority: 0,
    isDefault: true,
  },
  {
    code: "PRO",
    name: "Professionnel",
    description: "Meilleure visibilité et nombre d'annonces accru pour les agences.",
    price: 299,
    interval: "monthly",
    features: [
      "Publication de 25 annonces",
      "Visibilité prioritaire dans la recherche",
      "Notifications temps réel illimitées",
    ],
    listingLimit: 25,
    visibilityBoost: 25,
    priority: 10,
    isDefault: true,
  },
  {
    code: "PREMIUM",
    name: "Premium",
    description: "Visibilité maximale, analytics avancés et support dédié.",
    price: 599,
    interval: "monthly",
    features: [
      "Annonces illimitées",
      "Mise en avant sur la page d'accueil",
      "Support prioritaire et suivi dédié",
      "Statistiques avancées",
    ],
    listingLimit: 0,
    visibilityBoost: 60,
    priority: 20,
    isDefault: true,
  },
];

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const computeRenewalDate = (interval: string) => {
  const now = new Date();
  if (interval === "yearly") {
    return addMonths(now, 12);
  }
  return addMonths(now, 1);
};

class SubscriptionService {
  static async ensureDefaultPlans() {
    await Promise.all(
      DEFAULT_PLANS.map((plan) =>
        SubscriptionPlan.updateOne(
          { code: plan.code },
          { $setOnInsert: plan },
          { upsert: true },
        ),
      ),
    );
  }

  static async listPlans() {
    await this.ensureDefaultPlans();
    return SubscriptionPlan.find().sort({ priority: -1, price: 1 });
  }

  static async getPlanByCode(planCode: string) {
    await this.ensureDefaultPlans();
    const code = planCode.toUpperCase();
    const plan = await SubscriptionPlan.findOne({ code });
    if (!plan) {
      throw new ServiceError("Subscription plan not found", 404);
    }
    return plan;
  }

  static async getUserSubscription(userId: string) {
    return Subscription.findOne({ user: userId, status: "active" }).populate("plan");
  }

  static async assignPlanToUser(userId: string, planCode: string) {
    const plan = await this.getPlanByCode(planCode);
    const user = await User.findById(userId);
    if (!user) {
      throw new ServiceError("User not found", 404);
    }

    const renewsAt = computeRenewalDate(plan.interval);

    await Subscription.updateMany(
      { user: userId, status: "active" },
      { status: "canceled", canceledAt: new Date(), cancellationReason: "replaced_by_new_plan" },
    );

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      status: "active",
      startedAt: new Date(),
      renewsAt,
    });

    const tierCandidate = plan.code.toLowerCase();
    const allowedTiers = new Set(["free", "pro", "premium"]);
    const tier = allowedTiers.has(tierCandidate) ? tierCandidate : "free";

    await User.findByIdAndUpdate(userId, {
      subscription: subscription._id,
      subscriptionTier: tier,
      subscriptionStatus: "active",
      subscriptionRenewAt: renewsAt,
      visibilityBoost: plan.visibilityBoost,
    });

    await RealEstate.updateMany(
      { owner: userId },
      {
        visibilityTier: tier,
        visibilityScore: plan.visibilityBoost,
      },
    );

    await NotificationService.createNotification({
      userId,
      type: "subscription.updated",
      title: "Abonnement mis à jour",
      message: `Votre compte utilise désormais le plan ${plan.name}.`,
      payload: {
        planCode: plan.code,
        subscriptionId: subscription._id.toString(),
      },
      channels: ["in-app", "email"],
    });

    return subscription.populate("plan");
  }

  static async processRenewalReminders() {
    const now = new Date();
    const reminderWindowDays = Number(process.env.SUBSCRIPTION_RENEWAL_REMINDER_DAYS || 3);
    const reminderThreshold = new Date(now.getTime() + reminderWindowDays * 24 * 60 * 60 * 1000);

    const reminders = await Subscription.find({
      status: "active",
      renewsAt: { $gte: now, $lte: reminderThreshold },
      $or: [
        { "metadata.renewalReminderSentAt": { $exists: false } },
        { "metadata.renewalReminderSentAt": null },
      ],
    })
      .populate("plan")
      .populate("user", "email firstName subscriptionTier");

    await Promise.all(
      reminders.map(async (subscription) => {
        const plan = (subscription.plan as any)?.name ?? "votre abonnement";
        const userDoc = subscription.user as any;
        const userId = userDoc?._id?.toString?.() ?? subscription.user.toString();
        const renewalDate = subscription.renewsAt ? subscription.renewsAt.toISOString().slice(0, 10) : undefined;

        await NotificationService.createNotification({
          userId,
          type: "subscription.renewal.reminder",
          title: "Votre abonnement arrive à échéance",
          message: renewalDate
            ? `Votre abonnement ${plan} sera renouvelé le ${renewalDate}.`
            : `Votre abonnement ${plan} sera renouvelé prochainement.`,
          payload: {
            subscriptionId: subscription._id.toString(),
            renewsAt: subscription.renewsAt,
          },
          channels: ["in-app", "email"],
        });

        await Subscription.updateOne(
          { _id: subscription._id },
          { $set: { "metadata.renewalReminderSentAt": now } },
        );
      }),
    );

    const overdueSubscriptions = await Subscription.find({
      status: "active",
      renewsAt: { $lt: now },
      $or: [
        { "metadata.pastDueNotifiedAt": { $exists: false } },
        { "metadata.pastDueNotifiedAt": null },
      ],
    }).populate("user", "email");

    await Promise.all(
      overdueSubscriptions.map(async (subscription) => {
        const userDoc = subscription.user as any;
        const userId = userDoc?._id?.toString?.() ?? subscription.user.toString();

        await Subscription.updateOne(
          { _id: subscription._id },
          { $set: { status: "past_due", "metadata.pastDueNotifiedAt": now } },
        );

        await User.findByIdAndUpdate(userId, { subscriptionStatus: "past_due" });

        await NotificationService.createNotification({
          userId,
          type: "subscription.past_due",
          title: "Action requise : abonnement expiré",
          message: "Votre abonnement est arrivé à expiration. Veuillez mettre à jour votre paiement.",
          payload: {
            subscriptionId: subscription._id.toString(),
          },
          channels: ["in-app", "email"],
        });
      }),
    );

    return {
      remindersSent: reminders.length,
      markedPastDue: overdueSubscriptions.length,
    };
  }
}

export default SubscriptionService;
