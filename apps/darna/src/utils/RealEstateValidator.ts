import { body, param } from "express-validator";

class RealEstateValidator {
    // Create (all required where the model requires)
    static createRealEstateValidator = [
        // basic info
        body("title")
            .exists().withMessage("Title is required")
            .bail()
            .isString().withMessage("Title must be a string")
            .trim()
            .isLength({ min: 2, max: 200 }).withMessage("Title should be 2-200 characters"),

        body("owner")
            .not()
            .exists()
            .withMessage("owner is managed by the platform"),

        body("visibilityTier")
            .not()
            .exists()
            .withMessage("visibilityTier is managed by the platform"),

        body("visibilityScore")
            .not()
            .exists()
            .withMessage("visibilityScore is managed by the platform"),

        body("media")
            .not()
            .exists()
            .withMessage("media attachments are managed via dedicated endpoints"),

        body("description")
            .exists().withMessage("Description is required")
            .bail()
            .isString().withMessage("Description must be a string")
            .isLength({ min: 10 }).withMessage("Description should be at least 10 characters"),

        body("transactionType")
            .exists().withMessage("Transaction type is required")
            .bail()
            .isIn(["sale", "daily rental", "monthly", "seasonal"])
            .withMessage("Invalid transaction type"),

        body("price")
            .exists().withMessage("Price is required")
            .bail()
            .isFloat({ min: 0 }).withMessage("Price must be >= 0")
            .toFloat(),

        body("currency")
            .optional()
            .isString().withMessage("Currency must be a string")
            .trim()
            .isLength({ min: 3, max: 6 }).withMessage("Currency must be 3-6 characters")
            .customSanitizer((value) => value.toUpperCase()),

        body("availability")
            .optional()
            .isBoolean().withMessage("Availability must be boolean")
            .toBoolean(),

        body("availableFrom")
            .optional()
            .isISO8601().withMessage("availableFrom must be a valid ISO date")
            .toDate(),

        // location
        body("location").exists().withMessage("Location is required"),
        body("location.address")
            .exists().withMessage("Address is required")
            .bail()
            .isString().withMessage("Address must be a string")
            .trim()
            .isLength({ min: 2, max: 512 }).withMessage("Address must be 2-512 characters"),
        body("location.city")
            .optional()
            .isString().withMessage("City must be a string")
            .trim()
            .isLength({ max: 120 }).withMessage("City must be <= 120 characters"),
        body("location.country")
            .optional()
            .isString().withMessage("Country must be a string")
            .trim()
            .isLength({ max: 120 }).withMessage("Country must be <= 120 characters"),
        body("location.coordinates").exists().withMessage("Coordinates are required"),
        body("location.coordinates.latitude")
            .exists().withMessage("Latitude is required")
            .bail()
            .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90")
            .toFloat(),
        body("location.coordinates.longitude")
            .exists().withMessage("Longitude is required")
            .bail()
            .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180")
            .toFloat(),

        // characteristics
        body("characteristics").exists().withMessage("Characteristics are required"),
        body("characteristics.totalSurface")
            .exists().withMessage("Total surface is required")
            .bail()
            .isFloat({ min: 0 }).withMessage("Total surface must be >= 0")
            .toFloat(),
        body("characteristics.usableSurface")
            .optional()
            .isFloat({ min: 0 }).withMessage("Usable surface must be >= 0")
            .toFloat(),
        body("characteristics.bedroomCount")
            .exists().withMessage("Bedroom count is required")
            .bail()
            .isInt({ min: 0 }).withMessage("Bedroom count must be an integer >= 0")
            .toInt(),
        body("characteristics.bathroomCount")
            .exists().withMessage("Bathroom count is required")
            .bail()
            .isInt({ min: 0 }).withMessage("Bathroom count must be an integer >= 0")
            .toInt(),

        // room dimensions (optional array of objects)
        body("characteristics.roomDimensions")
            .optional()
            .isArray().withMessage("roomDimensions must be an array"),
        body("characteristics.roomDimensions.*.roomName")
            .optional()
            .isString().withMessage("roomName must be a string")
            .trim()
            .notEmpty().withMessage("roomName cannot be empty"),
        body("characteristics.roomDimensions.*.length")
            .optional()
            .isFloat({ min: 0 }).withMessage("length must be >= 0")
            .toFloat(),
        body("characteristics.roomDimensions.*.width")
            .optional()
            .isFloat({ min: 0 }).withMessage("width must be >= 0")
            .toFloat(),
        body("characteristics.roomDimensions.*.surface")
            .optional()
            .isFloat({ min: 0 }).withMessage("surface must be >= 0")
            .toFloat(),

        // equipment (all optional booleans)
        body("characteristics.equipment").optional().isObject().withMessage("equipment must be an object"),
        body("characteristics.equipment.wifi").optional().isBoolean().withMessage("wifi must be boolean").toBoolean(),
        body("characteristics.equipment.airConditioning").optional().isBoolean().withMessage("airConditioning must be boolean").toBoolean(),
        body("characteristics.equipment.parking").optional().isBoolean().withMessage("parking must be boolean").toBoolean(),
        body("characteristics.equipment.heating").optional().isBoolean().withMessage("heating must be boolean").toBoolean(),
        body("characteristics.equipment.balcony").optional().isBoolean().withMessage("balcony must be boolean").toBoolean(),
        body("characteristics.equipment.garden").optional().isBoolean().withMessage("garden must be boolean").toBoolean(),
        body("characteristics.equipment.pool").optional().isBoolean().withMessage("pool must be boolean").toBoolean(),
        body("characteristics.equipment.elevator").optional().isBoolean().withMessage("elevator must be boolean").toBoolean(),

        // internal rules (optional booleans)
        body("characteristics.internalRules").optional().isObject().withMessage("internalRules must be an object"),
        body("characteristics.internalRules.animalsAllowed").optional().isBoolean().withMessage("animalsAllowed must be boolean").toBoolean(),
        body("characteristics.internalRules.smokingAllowed").optional().isBoolean().withMessage("smokingAllowed must be boolean").toBoolean(),
        body("characteristics.internalRules.partiesAllowed").optional().isBoolean().withMessage("partiesAllowed must be boolean").toBoolean(),

        // energy diagnostics
        body("characteristics.energyDiagnostics")
            .optional()
            .isString().withMessage("energyDiagnostics must be a string")
            .trim()
            .isLength({ max: 8 }).withMessage("energyDiagnostics must be <= 8 characters")
            .customSanitizer((value) => value.toUpperCase()),
    ];

    // Update (all optional, same field rules)
    static updateRealEstateValidator = [
        body("title").optional().isString().withMessage("Title must be a string").trim().isLength({ min: 2, max: 200 }).withMessage("Title should be 2-200 characters"),
        body("description").optional().isString().withMessage("Description must be a string").isLength({ min: 10 }).withMessage("Description should be at least 10 characters"),
    body("owner").not().exists().withMessage("owner is managed by the platform"),
    body("visibilityTier").not().exists().withMessage("visibilityTier is managed by the platform"),
    body("visibilityScore").not().exists().withMessage("visibilityScore is managed by the platform"),

    body("media").not().exists().withMessage("media attachments are managed via dedicated endpoints"),

    body("transactionType").optional().isIn(["sale", "daily rental", "monthly", "seasonal"]).withMessage("Invalid transaction type"),
        body("price").optional().isFloat({ min: 0 }).withMessage("Price must be >= 0").toFloat(),
        body("currency")
            .optional()
            .isString().withMessage("Currency must be a string")
            .trim()
            .isLength({ min: 3, max: 6 }).withMessage("Currency must be 3-6 characters")
            .customSanitizer((value) => value.toUpperCase()),
        body("availability").optional().isBoolean().withMessage("Availability must be boolean").toBoolean(),
        body("availableFrom")
            .optional()
            .isISO8601().withMessage("availableFrom must be a valid ISO date")
            .toDate(),

        body("location").optional().isObject().withMessage("Location must be an object"),
    body("location.address").optional().isString().withMessage("Address must be a string").trim().isLength({ min: 2, max: 512 }).withMessage("Address must be 2-512 characters"),
    body("location.city").optional().isString().withMessage("City must be a string").trim().isLength({ max: 120 }).withMessage("City must be <= 120 characters"),
    body("location.country").optional().isString().withMessage("Country must be a string").trim().isLength({ max: 120 }).withMessage("Country must be <= 120 characters"),
        body("location.coordinates").optional().isObject().withMessage("Coordinates must be an object"),
        body("location.coordinates.latitude").optional().isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90").toFloat(),
        body("location.coordinates.longitude").optional().isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180").toFloat(),

        body("characteristics").optional().isObject().withMessage("Characteristics must be an object"),
    body("characteristics.totalSurface").optional().isFloat({ min: 0 }).withMessage("Total surface must be >= 0").toFloat(),
    body("characteristics.usableSurface").optional().isFloat({ min: 0 }).withMessage("Usable surface must be >= 0").toFloat(),
    body("characteristics.bedroomCount").optional().isInt({ min: 0 }).withMessage("Bedroom count must be an integer >= 0").toInt(),
    body("characteristics.bathroomCount").optional().isInt({ min: 0 }).withMessage("Bathroom count must be an integer >= 0").toInt(),

        body("characteristics.roomDimensions").optional().isArray().withMessage("roomDimensions must be an array"),
        body("characteristics.roomDimensions.*.roomName").optional().isString().withMessage("roomName must be a string").trim().notEmpty().withMessage("roomName cannot be empty"),
        body("characteristics.roomDimensions.*.length").optional().isFloat({ min: 0 }).withMessage("length must be >= 0").toFloat(),
        body("characteristics.roomDimensions.*.width").optional().isFloat({ min: 0 }).withMessage("width must be >= 0").toFloat(),
        body("characteristics.roomDimensions.*.surface").optional().isFloat({ min: 0 }).withMessage("surface must be >= 0").toFloat(),

        body("characteristics.equipment").optional().isObject().withMessage("equipment must be an object"),
        body("characteristics.equipment.wifi").optional().isBoolean().withMessage("wifi must be boolean").toBoolean(),
        body("characteristics.equipment.airConditioning").optional().isBoolean().withMessage("airConditioning must be boolean").toBoolean(),
        body("characteristics.equipment.parking").optional().isBoolean().withMessage("parking must be boolean").toBoolean(),
        body("characteristics.equipment.heating").optional().isBoolean().withMessage("heating must be boolean").toBoolean(),
        body("characteristics.equipment.balcony").optional().isBoolean().withMessage("balcony must be boolean").toBoolean(),
        body("characteristics.equipment.garden").optional().isBoolean().withMessage("garden must be boolean").toBoolean(),
        body("characteristics.equipment.pool").optional().isBoolean().withMessage("pool must be boolean").toBoolean(),
        body("characteristics.equipment.elevator").optional().isBoolean().withMessage("elevator must be boolean").toBoolean(),

        body("characteristics.internalRules").optional().isObject().withMessage("internalRules must be an object"),
        body("characteristics.internalRules.animalsAllowed").optional().isBoolean().withMessage("animalsAllowed must be boolean").toBoolean(),
        body("characteristics.internalRules.smokingAllowed").optional().isBoolean().withMessage("smokingAllowed must be boolean").toBoolean(),
        body("characteristics.internalRules.partiesAllowed").optional().isBoolean().withMessage("partiesAllowed must be boolean").toBoolean(),

    body("characteristics.energyDiagnostics").optional().isString().withMessage("energyDiagnostics must be a string").trim().isLength({ max: 8 }).withMessage("energyDiagnostics must be <= 8 characters").customSanitizer((value) => value.toUpperCase()),
    ];

    // Common
    static idParamValidator = [param("realEstateId").isMongoId().withMessage("Invalid id")];
    static mediaIdParamValidator = [param("mediaId").isMongoId().withMessage("Invalid media id")];
}

export default RealEstateValidator;