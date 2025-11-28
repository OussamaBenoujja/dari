import type { Express } from "express";
import { FilterQuery, SortOrder } from "mongoose";
import RealEstate from "../models/real-estate";
import MediaService from "./media.service";
import LlmService, { type ListingSummary } from "./llm.service";

type Dictionary = Record<string, any>;

export class ServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ServiceError";
    }
}

class RealEstateServices {

    private static async findByIdOrThrow(id: string) {
        const realEstate = await RealEstate.findById(id);
        if (!realEstate) {
            throw new ServiceError("Real-estate not found", 404);
        }
        return realEstate;
    }

    private static toNumber(value: unknown): number | undefined {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string" && value.trim() !== "") {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    }

    private static toInteger(value: unknown): number | undefined {
        const numeric = this.toNumber(value);
        if (numeric === undefined) {
            return undefined;
        }
        const integer = Math.trunc(numeric);
        return Number.isFinite(integer) ? integer : undefined;
    }

    private static toBoolean(value: unknown): boolean | undefined {
        if (typeof value === "boolean") {
            return value;
        }
        if (typeof value === "string") {
            if (["true", "1"].includes(value.toLowerCase())) {
                return true;
            }
            if (["false", "0"].includes(value.toLowerCase())) {
                return false;
            }
        }
        return undefined;
    }

    private static toDate(value: unknown): Date | undefined {
        if (value instanceof Date && !Number.isNaN(value.valueOf())) {
            return value;
        }
        if (typeof value === "string") {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.valueOf())) {
                return parsed;
            }
        }
        return undefined;
    }

    private static toString(value: unknown): string | undefined {
        if (typeof value === "string" && value.trim() !== "") {
            return value.trim();
        }
        return undefined;
    }

    private static parseStringArray(value: unknown): string[] {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.toString(item)).filter((item): item is string => Boolean(item));
        }
        const serialized = this.toString(value);
        if (!serialized) {
            return [];
        }
        return serialized
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0);
    }

    private static sanitizePagination(page: number | undefined, limit: number | undefined) {
        const safeLimit = Math.min(Math.max(limit ?? 10, 1), 100);
        const safePage = Math.max(page ?? 1, 1);
        const skip = (safePage - 1) * safeLimit;
        return { page: safePage, limit: safeLimit, skip };
    }

    private static buildSearchQuery(filters: Dictionary) {
        const query: Dictionary = {};

        const minPrice = this.toNumber(filters.minPrice);
        const maxPrice = this.toNumber(filters.maxPrice);
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) {
                query.price.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                query.price.$lte = maxPrice;
            }
        }

        const transactionType = this.toString(filters.transactionType ?? filters.type);
        if (transactionType) {
            query.transactionType = transactionType;
        }

        const currency = this.toString(filters.currency);
        if (currency) {
            query.currency = currency.toUpperCase();
        }

        const availability = this.toBoolean(filters.availability ?? filters.isAvailable);
        if (availability !== undefined) {
            query.availability = availability;
        }

        const availableFrom = this.toDate(filters.availableFrom);
        if (availableFrom) {
            query.availableFrom = { $lte: availableFrom };
        }

        const addressLike = this.toString(filters.location);
        if (addressLike) {
            query["location.address"] = { $regex: addressLike, $options: "i" };
        }

        const city = this.toString(filters.city);
        if (city) {
            query["location.city"] = { $regex: city, $options: "i" };
        }

        const country = this.toString(filters.country);
        if (country) {
            query["location.country"] = { $regex: country, $options: "i" };
        }

        const ownerId = this.toString(filters.owner ?? filters.ownerId);
        if (ownerId) {
            query.owner = ownerId;
        }

        const visibilityTier = this.toString(filters.visibilityTier);
        if (visibilityTier) {
            query.visibilityTier = visibilityTier.toLowerCase();
        }

    const equipmentFilters = this.parseStringArray(filters.equipment);
        const allowedEquipment = new Set([
            "wifi",
            "airConditioning",
            "parking",
            "heating",
            "balcony",
            "garden",
            "pool",
            "elevator",
        ]);
        equipmentFilters
            .filter((equipment) => allowedEquipment.has(equipment))
            .forEach((equipment) => {
                query[`characteristics.equipment.${equipment}`] = true;
            });

        const minBedrooms = this.toInteger(filters.minBedrooms ?? filters.bedrooms);
        if (minBedrooms !== undefined) {
            query["characteristics.bedroomCount"] = { $gte: minBedrooms };
        }

        const minBathrooms = this.toInteger(filters.minBathrooms ?? filters.bathrooms);
        if (minBathrooms !== undefined) {
            query["characteristics.bathroomCount"] = { $gte: minBathrooms };
        }

        const minSurface = this.toNumber(filters.minSurface ?? filters.minArea);
        const maxSurface = this.toNumber(filters.maxSurface ?? filters.maxArea);
        if (minSurface !== undefined || maxSurface !== undefined) {
            query["characteristics.totalSurface"] = {};
            if (minSurface !== undefined) {
                query["characteristics.totalSurface"].$gte = minSurface;
            }
            if (maxSurface !== undefined) {
                query["characteristics.totalSurface"].$lte = maxSurface;
            }
        }

        const usableSurface = this.toNumber(filters.usableSurfaceMin);
        if (usableSurface !== undefined) {
            query["characteristics.usableSurface"] = { $gte: usableSurface };
        }

        const energyClass = this.toString(filters.energyClass);
        if (energyClass) {
            query["characteristics.energyDiagnostics"] = energyClass.toUpperCase();
        }

    const latitude = this.toNumber(filters.latitude ?? filters.lat);
    const longitude = this.toNumber(filters.longitude ?? filters.lng ?? filters.long);
    const radiusKm = this.toNumber(filters.radiusKm ?? filters.radius);
        if (latitude !== undefined && longitude !== undefined && radiusKm !== undefined && radiusKm > 0) {
            query["location.geoPoint"] = {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radiusKm / 6378.1],
                },
            };
        }

        const textSearch = this.toString(filters.q ?? filters.query);
        if (textSearch) {
            query.$text = { $search: textSearch };
        }

        return query as FilterQuery<Dictionary>;
    }

    private static resolveSort(filters: Dictionary) {
        const allowedSortFields = new Set(["price", "createdAt", "availableFrom"]);
        const sortBy = this.toString(filters.sortBy);
        const sortOrder = this.toString(filters.sortOrder);
        if (sortBy && allowedSortFields.has(sortBy)) {
            const direction: SortOrder = sortOrder === "asc" ? "asc" : "desc";
            return { [sortBy]: direction, visibilityScore: -1, createdAt: -1 } as Record<string, SortOrder>;
        }
        return { visibilityScore: -1, createdAt: -1 } as Record<string, SortOrder>;
    }

    private static extractOwnerId(user: Dictionary) {
        return user?._id?.toString?.() ?? user?.id ?? user?.keycloakId;
    }

    private static deriveVisibilityFromUser(user: Dictionary) {
        const tier = typeof user?.subscriptionTier === "string" ? user.subscriptionTier : "free";
        const score = typeof user?.visibilityBoost === "number" ? user.visibilityBoost : 0;
        return { tier, score };
    }

    static async getAllRealEstates(page: number = 1, limit: number = 10) {
        const { page: safePage, limit: safeLimit, skip } = this.sanitizePagination(page, limit);
        const totalCount = await RealEstate.countDocuments();
        const totalPages = Math.max(Math.ceil(totalCount / safeLimit), 1);

        const allRealEstates = await RealEstate.find()
            .skip(skip)
            .limit(safeLimit)
            .sort({ visibilityScore: -1, createdAt: -1 })
            .select("-__v");

        return {
            data: allRealEstates,
            pagination: {
                currentPage: safePage,
                totalPages,
                totalCount,
                limit: safeLimit,
                hasNextPage: safePage < totalPages,
                hasPrevPage: safePage > 1,
            },
        };
    }

    static async showRealEstate(id: string) {
        const realEstate = await this.findByIdOrThrow(id);
        return realEstate;
    }

    static async createRealEstate(user: Dictionary, data: Dictionary) {
    const payload = { ...data } as Dictionary;
    delete payload.owner;
    delete payload.visibilityTier;
    delete payload.visibilityScore;
    delete payload.media;
        const duplicate = await RealEstate.exists({
            "location.address": payload.location?.address,
            "location.coordinates.latitude": payload.location?.coordinates?.latitude,
            "location.coordinates.longitude": payload.location?.coordinates?.longitude,
        });
        if (duplicate) {
            throw new ServiceError("A real-estate with the same address and coordinates already exists", 409);
        }

        const ownerId = this.extractOwnerId(user);
        if (!ownerId) {
            throw new ServiceError("Unable to determine listing owner", 400);
        }

        const visibility = this.deriveVisibilityFromUser(user);

        const newRealEstate = await RealEstate.create({
            ...payload,
            owner: ownerId,
            visibilityTier: visibility.tier,
            visibilityScore: visibility.score,
        });
        return newRealEstate;
    }

    static async updateRealEstate(id: string, data: Dictionary) {
        const sanitized = { ...data };
        delete sanitized.owner;
        delete sanitized.visibilityTier;
        delete sanitized.visibilityScore;
        delete sanitized.media;

        const updatedRealEstate = await RealEstate.findByIdAndUpdate(id, sanitized, {
            new: true,
            runValidators: true,
        });

        if (!updatedRealEstate) {
            throw new ServiceError("Real-estate not found", 404);
        }

        return updatedRealEstate;
    }

    static async deleteRealEstate(id: string) {
        const deletedRealEstate = await RealEstate.findByIdAndDelete(id);
        if (!deletedRealEstate) {
            throw new ServiceError("Real-estate not found", 404);
        }
        return deletedRealEstate;
    }

    private static assertOwnerPrivileges(realEstate: any, user: Dictionary, message = "You are not allowed to modify this listing") {
        const ownerId = this.extractOwnerId(user);
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        const isAdmin = roles.includes("admin");
        if (isAdmin) {
            return;
        }
        if (!ownerId || realEstate.owner?.toString?.() !== ownerId) {
            throw new ServiceError(message, 403);
        }
    }

    private static assertMediaPermissions(realEstate: any, user: Dictionary) {
        this.assertOwnerPrivileges(realEstate, user, "You are not allowed to modify media for this listing");
    }

    static async attachMedia(realEstateId: string, user: Dictionary, file: Express.Multer.File) {
        const realEstate = await this.findByIdOrThrow(realEstateId);
        this.assertMediaPermissions(realEstate, user);

        const uploaded = await MediaService.uploadRealEstateMedia(realEstateId, file);
        const mediaCollection = realEstate.media as any;
        const mediaEntry = typeof mediaCollection?.create === "function" ? mediaCollection.create(uploaded) : uploaded;
        if (typeof mediaCollection?.push === "function") {
            mediaCollection.push(mediaEntry);
        } else if (Array.isArray(realEstate.media)) {
            realEstate.media.push(mediaEntry as never);
        } else {
            realEstate.media = [mediaEntry];
        }
        await realEstate.save();
        return typeof mediaEntry?.toJSON === "function" ? mediaEntry.toJSON() : mediaEntry;
    }

    static async removeMedia(realEstateId: string, mediaId: string, user: Dictionary) {
        const realEstate = await this.findByIdOrThrow(realEstateId);
        this.assertMediaPermissions(realEstate, user);

        const mediaCollection = realEstate.media as any;
        const media = typeof mediaCollection?.id === "function" ? mediaCollection.id(mediaId) : null;
        if (!media) {
            throw new ServiceError("Media item not found", 404);
        }

        const plainMedia = typeof media.toObject === "function" ? media.toObject() : media;
        await MediaService.deleteRealEstateMedia({ key: plainMedia.key, thumbnailKey: plainMedia.thumbnailKey });
        if (typeof media.deleteOne === "function") {
            media.deleteOne();
        } else if (Array.isArray(realEstate.media)) {
            realEstate.media = realEstate.media.filter((item: any) => item?._id?.toString?.() !== mediaId);
        }
        await realEstate.save();
        return { success: true };
    }

    static async searchRealEstate(filters: Dictionary) {
        const query = this.buildSearchQuery(filters);
        const sort = this.resolveSort(filters);
        const { page, limit, skip } = this.sanitizePagination(
            this.toInteger(filters.page),
            this.toInteger(filters.limit) ?? this.toInteger(filters.take) ?? this.toInteger(filters.size) ?? undefined,
        );

        const [results, totalCount] = await Promise.all([
            RealEstate.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select("-__v"),
            RealEstate.countDocuments(query),
        ]);

        const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

        return {
            data: results,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            sort,
        };
    }

    static async updateAvailability(id: string, availability: boolean) {
        const updatedRealEstate = await RealEstate.findByIdAndUpdate(
            id,
            { availability },
            { new: true, runValidators: true },
        );

        if (!updatedRealEstate) {
            throw new ServiceError("Real-estate not found", 404);
        }

        return updatedRealEstate;
    }

    private static buildListingSummary(realEstate: any): ListingSummary {
        const equipmentEntries = Object.entries(realEstate?.characteristics?.equipment ?? {}).filter(([, value]) => Boolean(value));
        const equipmentList = equipmentEntries.map(([key]) => key.replace(/([A-Z])/g, " $1").trim());

        const internalRuleEntries = Object.entries(realEstate?.characteristics?.internalRules ?? {}).filter(([, value]) => Boolean(value));
        const internalRules = internalRuleEntries.map(([key]) => key.replace(/([A-Z])/g, " $1").trim());

        return {
            title: realEstate.title,
            description: realEstate.description,
            transactionType: realEstate.transactionType,
            price: realEstate.price,
            currency: realEstate.currency,
            location: {
                address: realEstate.location?.address,
                city: realEstate.location?.city,
                country: realEstate.location?.country,
                coordinates: realEstate.location?.coordinates,
            },
            characteristics: realEstate.characteristics,
            equipmentList,
            internalRules,
        };
    }

    static async estimatePrice(realEstateId: string, user: Dictionary) {
        const realEstate = await this.findByIdOrThrow(realEstateId);
        this.assertOwnerPrivileges(realEstate, user, "You are not allowed to request a price estimation for this listing");

        const listingSummary = this.buildListingSummary(realEstate);
        const imageUrls = Array.isArray(realEstate.media)
            ? realEstate.media
                  .filter((media: any) => typeof media?.contentType === "string" && media.contentType.startsWith("image/"))
                  .map((media: any) => media?.url)
                  .filter((url: unknown): url is string => typeof url === "string" && url.length > 0)
                  .slice(0, 3)
            : [];

        try {
            const estimation = await LlmService.requestPriceEstimation({
                listing: listingSummary,
                imageUrls,
            });

            const record = {
                minPrice: estimation.minPrice,
                maxPrice: estimation.maxPrice,
                currency: estimation.currency?.toUpperCase?.() ?? realEstate.currency,
                confidence: estimation.confidence,
                reasoning: estimation.reasoning,
                providerModel: estimation.providerModel,
                evaluatedAt: new Date(),
                raw: estimation.raw,
            };

            const history = Array.isArray(realEstate.priceEstimationHistory)
                ? [...realEstate.priceEstimationHistory, record]
                : [record];
            const maxHistoryEntries = 10;
            const normalizedHistory = history.length > maxHistoryEntries ? history.slice(history.length - maxHistoryEntries) : history;

            realEstate.priceEstimation = record as any;
            realEstate.priceEstimationHistory = normalizedHistory as any;
            await realEstate.save();

            return record;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to generate price estimation";
            throw new ServiceError(message, 502);
        }
    }
}

export default RealEstateServices;