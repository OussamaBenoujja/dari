import { Request, Response } from "express";
import AuthService from "../services/auth.service";
import { ServiceError } from "../services/realEstate.service";

class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        accountType = "individual",
      } = req.body ?? {};

      const normalizedAccountType = ((accountType as string)?.toLowerCase?.() ?? "individual") === "business"
        ? "business"
        : "individual";
      const tokens = await AuthService.registerUser({
        email,
        password,
        firstName,
        lastName,
        accountType: normalizedAccountType,
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: {
          accountType: normalizedAccountType,
          tokens,
        },
      });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(500).json({ success: false, message });
    }
  }
}

export default AuthController;
