import { Types } from "mongoose";
import Lead from "../models/lead";
import RealEstate from "../models/real-estate";
import NotificationService from "./notification.service";
import ChatService from "./chat.service";
import { ServiceError } from "./realEstate.service";

interface CreateLeadOptions {
  listingId: string;
  buyerId: string;
  message?: string;
  budget?: number;
  moveInDate?: string | Date;
}

interface UpdateLeadStatusOptions {
  leadId: string;
  ownerId: string;
  status: string;
}

const ALLOWED_STATUSES = new Set(["new", "in_progress", "won", "lost", "archived"]);

class LeadService {
  static async createLead({ listingId, buyerId, message, budget, moveInDate }: CreateLeadOptions) {
    const listing = await RealEstate.findById(listingId).populate("owner");
    if (!listing) {
      throw new ServiceError("Listing not found", 404);
    }
    if (!listing.owner) {
      throw new ServiceError("Listing owner not found", 400);
    }
    const ownerId =
      listing.owner instanceof Types.ObjectId
        ? listing.owner.toString()
        : (listing.owner as any)?._id?.toString?.() ?? (listing.owner as any)?.id ?? undefined;
    if (ownerId === buyerId) {
      throw new ServiceError("You cannot create a lead on your own listing", 400);
    }
    if (!ownerId) {
      throw new ServiceError("Unable to resolve listing owner", 400);
    }

    const existing = await Lead.findOne({
      listing: listing._id,
      buyer: new Types.ObjectId(buyerId),
      status: { $in: ["new", "in_progress"] },
    });
    if (existing) {
      return existing;
    }

    const conversation = await ChatService.sendMessage({
      listingId,
      participants: [ownerId],
      senderId: buyerId,
      content: message ?? "Bonjour, je suis intéressé par votre annonce.",
      metadata: {
        leadContext: true,
        listingId,
      },
    });

    const lead = await Lead.create({
      listing: listing._id,
      buyer: new Types.ObjectId(buyerId),
      owner: new Types.ObjectId(ownerId),
      conversation: conversation.conversation?._id ?? conversation.conversation,
      initialMessage: message,
      budget,
      moveInDate: moveInDate ? new Date(moveInDate) : undefined,
    });

    await NotificationService.createNotification({
      userId: ownerId,
      type: "lead.new",
      title: "Nouveau lead",
      message: `${listing.title} a reçu une nouvelle demande`,
      payload: {
        leadId: lead._id.toString(),
        listingId: listingId,
        conversationId: lead.conversation?.toString(),
      },
      channels: ["in-app", "email"],
    });

    return lead.populate([
      { path: "buyer", select: "firstName lastName email subscriptionTier" },
      { path: "listing", select: "title price visibilityTier" },
    ]);
  }

  static async listLeadsForOwner(ownerId: string, status?: string) {
    const filter: Record<string, unknown> = { owner: new Types.ObjectId(ownerId) };
    if (status && ALLOWED_STATUSES.has(status)) {
      filter.status = status;
    }
    return Lead.find(filter)
      .populate("buyer", "firstName lastName email subscriptionTier")
      .populate("listing", "title price availability visibilityTier")
      .populate("conversation")
      .sort({ updatedAt: -1 });
  }

  static async listLeadsForBuyer(buyerId: string) {
    return Lead.find({ buyer: new Types.ObjectId(buyerId) })
      .populate("listing", "title price availability visibilityTier")
      .populate("conversation")
      .sort({ updatedAt: -1 });
  }

  static async updateLeadStatus({ leadId, ownerId, status }: UpdateLeadStatusOptions) {
    if (!ALLOWED_STATUSES.has(status)) {
      throw new ServiceError("Invalid status", 400);
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: new Types.ObjectId(leadId), owner: new Types.ObjectId(ownerId) },
      { status },
      { new: true },
    );

    if (!lead) {
      throw new ServiceError("Lead not found", 404);
    }

    const buyerId = (lead.buyer as any)?._id?.toString?.() ?? lead.buyer.toString();

    await NotificationService.createNotification({
      userId: buyerId,
      type: "lead.status",
      title: "Mise à jour du lead",
      message: `Le statut de votre demande est maintenant ${status}`,
      payload: {
        leadId: lead._id.toString(),
        status,
      },
      channels: ["in-app", "email"],
    });

    return lead;
  }
}

export default LeadService;
