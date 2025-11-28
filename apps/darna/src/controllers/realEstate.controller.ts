import { Request, Response } from "express";
import RealEstateServices, { ServiceError } from "../services/realEstate.service";
import UserService, { KeycloakTokenPayload } from "../services/user.service";

class RealEstateControllers {
    private static handleError(res: Response, error: unknown): void {
        if (error instanceof ServiceError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
            return;
        }

        const fallbackMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(500).json({
            success: false,
            message: fallbackMessage,
        });
    }

    static async getAllRealEstates(req: Request, res: Response): Promise<void> {
        try {
            const page: number = parseInt(req.query.page as string) || 1;
            const limit: number = parseInt(req.query.limit as string) || 10;

            const result: object | null = await RealEstateServices.getAllRealEstates(page, limit);

            res.status(200).json({
                success: true,
                message: "Real estates retrieved successfully",
                ...result
            });

        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async myListings(req: Request, res: Response): Promise<void> {
        try {
            const tokenPayload = ((req as Request & { user?: unknown }).user ?? {}) as KeycloakTokenPayload;
            const authUser = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
            const ownerId = authUser?._id?.toString?.();
            if (!ownerId) {
                throw new ServiceError("Unable to determine listing owner", 400);
            }

            const filters = { ...req.query, owner: ownerId } as Record<string, unknown>;
            const listings = await RealEstateServices.searchRealEstate(filters as Record<string, any>);

            res.status(200).json({
                success: true,
                message: "Owner listings retrieved successfully",
                ...listings,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async showRealEstate(req: Request, res: Response): Promise<any> {
        try {
            const id: string = req.params.realEstateId;
            const result: object | null = await RealEstateServices.showRealEstate(id);

            res.status(200).json({
                success: true,
                message: "Real estate retrieved successfully",
                data: result,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async createRealEstate(req: Request, res: Response): Promise<any> {
        try {
            const tokenPayload = ((req as Request & { user?: unknown }).user ?? {}) as KeycloakTokenPayload;
            const authUser = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
            const data: any = req.body;
            const newRealEstate: object = await RealEstateServices.createRealEstate(authUser, data);

            res.status(201).json({
                success: true,
                message: "Real estate created successfully",
                data: newRealEstate,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async updateRealEstate(req: Request, res: Response): Promise<any> {
        try {
            const realEstateId: string = req.params.realEstateId;
            const updatedData: any = req.body;
            const updatedRealEstate: object = await RealEstateServices.updateRealEstate(realEstateId, updatedData);

            res.status(200).json({
                success: true,
                message: "Real estate updated successfully",
                data: updatedRealEstate,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async deleteRealEstate(req: Request, res: Response): Promise<any> {
        try {
            const realEstateId: string = req.params.realEstateId;
            const deletedRealEstate = await RealEstateServices.deleteRealEstate(realEstateId);
            res.status(200).json({
                success: true,
                message: "Real estate removed successfully",
                data: deletedRealEstate,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async searchRealEstate(req: Request, res: Response): Promise<any> {
        try {
            const filters = req.query;
            const search = await RealEstateServices.searchRealEstate(filters as Record<string, any>);

            res.status(200).json({
                success: true,
                message: "Search completed successfully",
                ...search,
                count: search?.pagination?.totalCount ?? 0,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async uploadMedia(req: Request, res: Response) {
        try {
            const file = (req as Request & { file?: Express.Multer.File }).file;
            if (!file) {
                res.status(400).json({ success: false, message: "No file provided" });
                return;
            }

            const tokenPayload = ((req as Request & { user?: unknown }).user ?? {}) as KeycloakTokenPayload;
            const authUser = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
            const realEstateId = req.params.realEstateId;
            const media = await RealEstateServices.attachMedia(realEstateId, authUser, file);

            res.status(201).json({
                success: true,
                message: "Media uploaded successfully",
                data: media,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async deleteMedia(req: Request, res: Response) {
        try {
            const { realEstateId, mediaId } = req.params;
            const tokenPayload = ((req as Request & { user?: unknown }).user ?? {}) as KeycloakTokenPayload;
            const authUser = await UserService.findOrCreateByKeycloakPayload(tokenPayload);

            await RealEstateServices.removeMedia(realEstateId, mediaId, authUser);

            res.status(200).json({
                success: true,
                message: "Media removed successfully",
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }

    static async estimatePrice(req: Request, res: Response) {
        try {
            const tokenPayload = ((req as Request & { user?: unknown }).user ?? {}) as KeycloakTokenPayload;
            const authUser = await UserService.findOrCreateByKeycloakPayload(tokenPayload);
            const estimation = await RealEstateServices.estimatePrice(req.params.realEstateId, authUser);

            res.status(200).json({
                success: true,
                message: "Price estimation generated successfully",
                data: estimation,
            });
        } catch (error: unknown) {
            this.handleError(res, error);
        }
    }
}

export default RealEstateControllers;