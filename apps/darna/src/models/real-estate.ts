import mongoose, { Schema } from "mongoose";

const roomDimensionSchema = new Schema(
    {
        roomName: { type: String, trim: true, maxlength: 120 },
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        surface: { type: Number, min: 0 },
    },
    { _id: false },
);

const equipmentSchema = new Schema(
    {
        wifi: { type: Boolean, default: false },
        airConditioning: { type: Boolean, default: false },
        parking: { type: Boolean, default: false },
        heating: { type: Boolean, default: false },
        balcony: { type: Boolean, default: false },
        garden: { type: Boolean, default: false },
        pool: { type: Boolean, default: false },
        elevator: { type: Boolean, default: false },
    },
    { _id: false },
);

const mediaSchema = new Schema(
    {
        key: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        thumbnailKey: { type: String, trim: true },
        thumbnailUrl: { type: String, trim: true },
        contentType: { type: String, trim: true },
        size: { type: Number, min: 0 },
    },
    { timestamps: true },
);

mediaSchema.set("toJSON", {
    transform(_doc, ret) {
        const transformed: Record<string, unknown> = { ...ret };
        delete transformed.thumbnailKey;
        return transformed;
    },
});

const internalRulesSchema = new Schema(
    {
        animalsAllowed: { type: Boolean, default: false },
        smokingAllowed: { type: Boolean, default: false },
        partiesAllowed: { type: Boolean, default: false },
    },
    { _id: false },
);

const locationSchema = new Schema(
    {
        address: { type: String, required: true, trim: true, maxlength: 512 },
        city: { type: String, trim: true, maxlength: 120 },
        country: { type: String, trim: true, maxlength: 120 },
        coordinates: {
            latitude: { type: Number, required: true, min: -90, max: 90 },
            longitude: { type: Number, required: true, min: -180, max: 180 },
        },
        geoPoint: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator(value: number[]) {
                        return Array.isArray(value) && value.length === 2;
                    },
                    message: "geoPoint.coordinates must be a [longitude, latitude] pair",
                },
            },
        },
    },
    { _id: false },
);

const characteristicsSchema = new Schema(
    {
        totalSurface: { type: Number, required: true, min: 0 },
        usableSurface: { type: Number, min: 0 },
        roomDimensions: { type: [roomDimensionSchema], default: [] },
        bedroomCount: { type: Number, required: true, min: 0 },
        bathroomCount: { type: Number, required: true, min: 0 },
        equipment: { type: equipmentSchema, default: () => ({}) },
        internalRules: { type: internalRulesSchema, default: () => ({}) },
        energyDiagnostics: { type: String, trim: true, uppercase: true, maxlength: 8 },
    },
    { _id: false },
);

const realEstateSchema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
        title: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
        description: { type: String, required: true, trim: true, minlength: 10 },
        transactionType: {
            type: String,
            required: true,
            enum: ["sale", "daily rental", "monthly", "seasonal"],
        },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, trim: true, uppercase: true, default: "MAD", maxlength: 6 },
        availability: { type: Boolean, default: true },
        availableFrom: { type: Date },
        location: { type: locationSchema, required: true },
        characteristics: { type: characteristicsSchema, required: true },
        visibilityTier: { type: String, trim: true, lowercase: true, default: "free", index: true },
        visibilityScore: { type: Number, default: 0, index: true },
        media: { type: [mediaSchema], default: [] },
        priceEstimation: {
            type: new Schema(
                {
                    minPrice: { type: Number, min: 0 },
                    maxPrice: { type: Number, min: 0 },
                    currency: { type: String, trim: true, uppercase: true, maxlength: 6 },
                    confidence: { type: Number, min: 0, max: 1 },
                    reasoning: { type: String, trim: true },
                    providerModel: { type: String, trim: true },
                    evaluatedAt: { type: Date, default: () => new Date() },
                    raw: { type: Schema.Types.Mixed },
                },
                { _id: false },
            ),
            default: null,
        },
        priceEstimationHistory: {
            type: [
                new Schema(
                    {
                        minPrice: { type: Number, min: 0 },
                        maxPrice: { type: Number, min: 0 },
                        currency: { type: String, trim: true, uppercase: true, maxlength: 6 },
                        confidence: { type: Number, min: 0, max: 1 },
                        reasoning: { type: String, trim: true },
                        providerModel: { type: String, trim: true },
                        evaluatedAt: { type: Date, default: () => new Date() },
                        raw: { type: Schema.Types.Mixed },
                    },
                    { _id: false },
                ),
            ],
            default: [],
        },
    },
    {
        timestamps: true,
            toJSON: {
                versionKey: false,
                virtuals: true,
                transform(_doc, ret) {
                    const transformed: Record<string, unknown> = { ...ret, id: ret._id };
                    delete (transformed as { _id?: string })._id;
                    return transformed;
                },
            },
            toObject: { virtuals: true },
    },
);

realEstateSchema.index({ "location.geoPoint": "2dsphere" });
realEstateSchema.index({ transactionType: 1, price: 1 });
realEstateSchema.index({ availability: 1 });
realEstateSchema.index({ title: "text", description: "text", "location.address": "text" });
realEstateSchema.index({ visibilityScore: -1, createdAt: -1 });

realEstateSchema.pre("validate", function (next) {
    const latitude = this.location?.coordinates?.latitude;
    const longitude = this.location?.coordinates?.longitude;
    if (typeof latitude === "number" && typeof longitude === "number") {
        this.location.geoPoint = { type: "Point", coordinates: [longitude, latitude] };
    }
    next();
});

const RealEstate = mongoose.model("RealEstate", realEstateSchema);

export default RealEstate;