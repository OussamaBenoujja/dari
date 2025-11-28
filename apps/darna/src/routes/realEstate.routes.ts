import e from "express";
import RealEstateControllers from "../controllers/realEstate.controller";
import validationResultMiddleware from "../middlewares/validationResult";
import RealEstateValidator from "../utils/RealEstateValidator";
import { uploadRealEstateMedia } from "../middlewares/upload";
import { kcProtect } from "../middlewares/kcJwt";

const router = e.Router()

router.get('/', RealEstateControllers.getAllRealEstates);
router.get('/search', RealEstateControllers.searchRealEstate);
router.get('/mine', kcProtect, RealEstateControllers.myListings);
router.get(
	'/:realEstateId',
	RealEstateValidator.idParamValidator,
	validationResultMiddleware,
	RealEstateControllers.showRealEstate,
);
router.post(
	'/',
	kcProtect,
	RealEstateValidator.createRealEstateValidator,
	validationResultMiddleware,
	RealEstateControllers.createRealEstate,
);
router.patch(
	'/:realEstateId',
	kcProtect,
	RealEstateValidator.idParamValidator,
	RealEstateValidator.updateRealEstateValidator,
	validationResultMiddleware,
	RealEstateControllers.updateRealEstate,
);
router.post(
	'/:realEstateId/estimate',
	kcProtect,
	RealEstateValidator.idParamValidator,
	validationResultMiddleware,
	RealEstateControllers.estimatePrice,
);
router.delete(
	'/:realEstateId',
	kcProtect,
	RealEstateValidator.idParamValidator,
	validationResultMiddleware,
	RealEstateControllers.deleteRealEstate,
);

router.post(
	'/:realEstateId/media',
	kcProtect,
	RealEstateValidator.idParamValidator,
	validationResultMiddleware,
	uploadRealEstateMedia,
	RealEstateControllers.uploadMedia,
);

router.delete(
	'/:realEstateId/media/:mediaId',
	kcProtect,
	RealEstateValidator.idParamValidator,
	RealEstateValidator.mediaIdParamValidator,
	validationResultMiddleware,
	RealEstateControllers.deleteMedia,
);

export default router;