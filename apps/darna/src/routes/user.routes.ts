import { Router } from "express";
import UserController from "../controllers/user.controller";
import { uploadUserImage } from "../middlewares/upload";

const router = Router();

router.get("/me", UserController.me);
router.post("/me/profile-image", uploadUserImage, UserController.uploadProfileImage);
router.post("/me/banner-image", uploadUserImage, UserController.uploadBannerImage);

export default router;
