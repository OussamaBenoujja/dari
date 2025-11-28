import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

const formatError = (message: string, location: string, path: string) => ({
  message,
  location,
  path,
});

const validationResultMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const errors = result.array({ onlyFirstError: true }).map((error) => {
    if ("param" in error && "location" in error) {
      return formatError(String(error.msg), String(error.location), String(error.param));
    }
    return formatError(String(error.msg), "unknown", "unknown");
  });

  res.status(422).json({
    success: false,
    message: "Validation failed",
    errors,
  });
};

export default validationResultMiddleware;
