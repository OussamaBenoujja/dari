const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  submitVerification,
  listManualVerifications,
  manualVerificationReview,
  listNotifications,
  markNotificationsRead,
  openTicket,
  listMyTickets,
  listAllTickets,
  respondTicket,
  stripeOnboard,
  stripeComplete,
} = require("../controllers/userController");
const kcAuth = require("../middlewares/kcAuth");
const { isAdmin } = require("../middlewares/kcRoles");

const router = express.Router();

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: Authenticate a user and return a JWT
 *     tags:
 *       - Auth
 */
router.post("/login", loginUser);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Get user profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", kcAuth, getProfile);

/**
 * @openapi
 * /api/users/verification/manual-queue:
 *   get:
 *     summary: List manual verification requests (admin only)
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 */
router.get("/verification/manual-queue", kcAuth, isAdmin, listManualVerifications);

/**
 * @openapi
 * /api/users/verification/{requestId}/manual-review:
 *   post:
 *     summary: Admin manual verification review
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 */
router.post("/verification/:requestId/manual-review", kcAuth, isAdmin, manualVerificationReview);

/**
 * @openapi
 * /api/users/notifications:
 *   get:
 *     summary: List user notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 */
router.get("/notifications", kcAuth, listNotifications);

/**
 * @openapi
 * /api/users/notifications/mark-read:
 *   post:
 *     summary: Mark notifications as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 */
router.post("/notifications/mark-read", kcAuth, markNotificationsRead);

/**
 * @openapi
 * /api/users/tickets:
 *   post:
 *     summary: Open a support ticket
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 */
router.post("/tickets", kcAuth, openTicket);

/**
 * @openapi
 * /api/users/tickets:
 *   get:
 *     summary: List my tickets
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 */
router.get("/tickets", kcAuth, listMyTickets);

/**
 * @openapi
 * /api/users/tickets/all:
 *   get:
 *     summary: List all tickets (admin only)
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 */
router.get("/tickets/all", kcAuth, isAdmin, listAllTickets);

/**
 * @openapi
 * /api/users/tickets/{ticketId}/respond:
 *   post:
 *     summary: Admin respond to a ticket
 *     tags:
 *       - Tickets
 *     security:
 *       - bearerAuth: []
 */
router.post("/tickets/:ticketId/respond", kcAuth, isAdmin, respondTicket);

/**
 * @openapi
 * /api/users/verification:
 *   post:
 *     summary: Submit user verification
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 */
router.post("/verification", kcAuth, submitVerification);

/**
 * @openapi
 * /api/users/stripe/onboard:
 *   post:
 *     summary: Start Stripe Connect onboarding
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 */
router.post("/stripe/onboard", kcAuth, stripeOnboard);

/**
 * @openapi
 * /api/users/stripe/complete:
 *   get:
 *     summary: Complete Stripe Connect onboarding
 *     tags:
 *       - Stripe
 *     security:
 *       - bearerAuth: []
 */
router.get("/stripe/complete", kcAuth, stripeComplete);

module.exports = router;
