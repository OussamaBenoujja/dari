import { body } from "express-validator";

class AuthValidator {
  //email
  static emailValidator = [
    body("email")
      .exists()
      .withMessage("Email is required")
      .isEmail()
      .normalizeEmail()
      .withMessage("the email is invalid, please try again"),
  ];

  // password
  static passwordValidator = [
    body("password")
      .exists()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password should be at least 6 letters"),
  ];

  //register
  static registerValidator = [
    body("firstName")
      .exists()
      .withMessage("First name is required")
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage("First name should be between 2-20 letters"),
    body("lastName")
      .exists()
      .withMessage("Last name is required")
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage("Last name should be between 2-20 letters"),

    ...AuthValidator.emailValidator,
    ...AuthValidator.passwordValidator,

    body("confirmPassword")
      .exists()
      .withMessage("confirmation failed, please try again"),
    body("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Password confirmation does not match"),

    body("accountType")
      .optional()
      .isString()
      .trim()
      .toLowerCase()
      .isIn(["individual", "business"])
      .withMessage("Invalid account type. Allowed: individual, business"),
  ];

  // login
  static loginValidator = [
    ...AuthValidator.emailValidator,
    ...AuthValidator.passwordValidator,
  ];

  //token
  static tokenValidator = [
    body("token").exists().withMessage("Token is required"),
  ];
}

export default AuthValidator;
