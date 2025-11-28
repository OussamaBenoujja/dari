import express from "express";
import axios from "axios";
import { kcProtect, kcUserInfo } from "../middlewares/kcJwt";
import { KC_CLIENT_ID, KC_CLIENT_SECRET, kcTokenEndpoint } from "../config/keycloak";
import SecurityController from "../controllers/security.controller";
import AuthController from "../controllers/auth.controller";
import AuthValidator from "../utils/AuthValidator";
import validationResultMiddleware from "../middlewares/validationResult";

const router = express.Router();

router.post(
  "/register",
  AuthValidator.registerValidator,
  validationResultMiddleware,
  AuthController.register,
);

router.post("/login", async (req, res) => {
  const body = req.body || {};
  const usernameInput = body.username ?? body.email;
  const password = body.password;
  const username = typeof usernameInput === "string" ? usernameInput.toLowerCase() : usernameInput;
  if (!username || !password) return res.status(400).json({ message: "need username & password" });
  try {
    const params: any = {
      grant_type: "password",
      client_id: KC_CLIENT_ID,
      username,
      password,
    };
    if (KC_CLIENT_SECRET) params.client_secret = KC_CLIENT_SECRET;
    const r = await axios.post(kcTokenEndpoint(), new URLSearchParams(params).toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    res.json(r.data);
  } catch (e: any) {
    res.status(401).json({ message: "bad creds", error: e.message });
  }
});

router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ message: "need refresh_token" });
  try {
    const params: any = {
      grant_type: "refresh_token",
      client_id: KC_CLIENT_ID,
      refresh_token,
    };
    if (KC_CLIENT_SECRET) params.client_secret = KC_CLIENT_SECRET;
    const r = await axios.post(kcTokenEndpoint(), new URLSearchParams(params).toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    res.json(r.data);
  } catch (e: any) {
    res.status(401).json({ message: "bad refresh token", error: e.message });
  }
});


router.get("/me", kcProtect, kcUserInfo);


router.post("/verify-email", kcProtect, SecurityController.sendVerificationEmail);
router.get("/2fa/status", kcProtect, SecurityController.twoFactorStatus);
router.post("/2fa/enable", kcProtect, SecurityController.enableTwoFactor);
router.post("/2fa/disable", kcProtect, SecurityController.disableTwoFactor);

router.get("/privacy/export", kcProtect, SecurityController.exportData);
router.delete("/privacy", kcProtect, SecurityController.deleteData);

export default router;
