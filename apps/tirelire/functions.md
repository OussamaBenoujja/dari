# Function & Service Reference

This cheat-sheet explains the main functions, services, middleware, and helpers defined in the project. It is not formal API documentation; instead it focuses on *what* each function does, *where* to find it, and any important side-effects or dependencies to keep in mind while hacking on the code.

> Paths below are relative to `src/` unless stated otherwise.

---

## Config Helpers

### config/jwt.js
- **`createJWT(email, expOverride?)`** – builds a signed HS256 JWT with the user email and expiration (defaults to `process.env.JWT_EXPIRES_IN`). Uses a custom base64url helper.
- **`verifyJWT(token)`** – checks signature and expiration. Returns boolean; does not throw.
- **`decodeJWT(token)`** – decodes payload JSON (without verifying); returns object or `null`.

### config/db.js
- **`dbConnection()`** – async initializer for Mongoose using `process.env.mongoLink`. Logs success or error, but does not throw (errors are swallowed after logging).

---

## Utils

### utils/validator.js
Primitive validation helpers used across services.
- `isNonEmptyString(value)`
- `isValidEmail(email)`
- `isValidPassword(password)`
- `validateLoginInputs(email, password)` – returns `{ field: message }` map.
- `validateRegisterInputs(data)`
- `isValidInvitationAction(action)` – allows `accept|decline|cancel`.
- `validateVerificationInputs(data)` – ensures required verification payload fields.

---

## Middleware

### middlewares/auth.js
Simple bearer-token guard.
- Reads `Authorization` header, verifies `Bearer <token>`.
- Uses `AuthService.verifyToken()`; on success attaches `req.user = payload`.
- Sends 401 on missing/invalid tokens.

### middlewares/requireVerified.js
Ensures the authenticated user is verified.
- Looks up user by email using `UserService`.
- Rejects with 401/404/403 as needed.
- On success, stores full Mongoose user document in `req.authUser` for downstream handlers.

### middlewares/errorHandler.js
- Logs the error to console, returns JSON `{ message }` with status from `err.status` or 500.

---

## Services

### services/AuthService.js
- **constructor** – instantiates internal `UserService`.
- **`register(data)`** – validates payload, checks email uniqueness, creates user via `UserService.createUser`, returns `{ token, user }` without password.
- **`login(email, password)`** – validates inputs, fetches user with password, checks bcrypt hash, returns `{ token, user }`.
- **`logout()`** – dummy response `{ message: 'Logged out' }`.
- **`verifyToken(token)`** – wraps `jwtHelper` helpers. Returns `{ valid: boolean, payload? }`.

### services/UserService.js
CRUD + verification helpers for users.
- `createUser`, `getUserByEmail`, `getUserById`, `updateUser`, `deleteUser`, `getAllUsers` – thin Mongoose wrappers.
- `verifyPassword(email, password)` – fetches hashed password and compares.
- `login`, `register` – legacy helpers (AuthService now orchestrates register/login).
- `verifyID(id, type, idNumber, cardImage, selfie?)` – marks a user as verified manually.
- `submitVerificationRequest(userId, payload)` / `manualVerificationDecision(...)` – lazy loads `VerificationService` and delegates.

### services/GroupService.js
Encapsulates group lifecycle and membership logic.
- **constructor** – wires `UserService` + `CreditService`.
- **`createGroup(name, createdBy, amount, interval)`** – enforces eligibility (`CreditService.assertUserEligibleForGroup`) and verification, creates group, sets creator’s `activeGroup`.
- **`getGroupById(id)` / `getAllGroups()`** – return fully populated group docs.
- **`addMember(groupId, userId)`** – checks eligibility, appends to members array, updates `activeGroup`.
- **`removeMember(groupId, userId)`** – blocks removal if outstanding contributions exist; removes member, adjusts payout order and `activeGroup`.
- **`updateGroup`, `deleteGroup`** – basic CRUD wrappers.
- **`addMessage(groupId, senderId, type, content)`** – pushes a message into the group’s message array.
- **`startNextRound(groupId, startDate?)`** – delegates to `CreditService.startNextRound`.
- **`closeRound(groupId, roundNumber)`** – delegates to `CreditService.closeRoundIfSettled`.
- **`getGroupsByUserId(userId)` / `getMessagesByGroupId(groupId)`** – convenience fetchers.
- **`getTransactionLogs(groupId)`** – builds an array of contribution history per member.

### services/CreditService.js
Manages contribution scheduling, penalties, and reliability scoring.
- **constructor(options?)** – configures grace period, penalty points, reward points.
- **`startNextRound(groupId, startDate?)`** – builds/updates `payoutOrder`, selects next beneficiary, sets due dates, ensures contribution docs exist.
- **`buildInitialPayoutOrder(members)`** – sorts by `reliabilityScore` descending, then `joinDate`.
- **`ensureRoundHistory(group, roundNumber, beneficiary, startedAt, dueDate)`** – writes/updates history entries.
- **`ensureRoundContributions(group, roundNumber, dueDate)`** – lazily creates contribution records for each active member.
- **`recordContributionPayment(contributionId, paymentDate?)`** – marks contribution `paid`, rewards reliability, clears outstanding counters, updates totals.
- **`applyPenalties(referenceDate?)`** – finds overdue contributions, marks as `missed`, reduces reliability, bans chronic defaulters, increments outstanding counters.
- **`closeRoundIfSettled(groupId, roundNumber)`** – updates round status (`active` → `complete`/`defaulted`).
- **`assertUserEligibleForGroup(userId)`** – ensures user is not already in another group and has no outstanding debts.
- **`calculateDueDate(startDate, interval)`** – helper returning a future `Date`.

### services/InvitationService.js
Orchestrates invites/join requests.
- **constructor** – reuses `GroupService`/`UserService`.
- **`sendInvite(senderId, recipientId, groupId, message?)`** – owner invites another user; prevents duplicates.
- **`sendJoinRequest(senderId, groupId, message?)`** – non-member requests to join; notifies owner.
- **`respond(invitationId, action, actorId)`** – handles `accept/decline/cancel` with permission checks; accepts trigger `GroupService.addMember`.
- **`listPendingForUser(userId)` / `listPendingForGroup(groupId)`** – query pending invites/requests.
- **Helper methods** – `checkBasicData`, `userIsMember`, `canRespond`, `addMemberAfterAccept`.

### services/VerificationService.js
Handles automatic + manual KYC verification.
- **constructor(options?)** – sets model paths, face match threshold, auto flag.
- **`submitVerification(userId, payload)`** – validates inputs, creates `VerificationRequest`, runs `tryAutomaticVerification`, updates user + request.
- **`manualReview(requestId, reviewerId, decision, notes)`** – admin fallback.
- **`getLatestRequestForUser`**, **`listManualQueue`** – retrieval helpers.
- **`tryAutomaticVerification(request)`** – loads TensorFlow/face-api models if needed, computes descriptors, returns `{ processed, matched, score, reason }`.
- **`ensureModels`, `getFaceDescriptor`, `assertFileExists`, `isImageFile`** – internal helpers.

### services/PaymentService.js
Stripe integration and contribution CRUD helpers.
- **constructor** – initializes Stripe client + `CreditService`.
- **`createPaymentIntent(amount, currency, contributionId?)`** – creates Stripe PaymentIntent, stores ID on contribution if provided.
- **`verifyContributionPayment(contributionId)`** – retrieves intent; if succeeded, calls `CreditService.recordContributionPayment` and returns updated contribution + PaymentIntent.
- **`recordContribution(groupId, memberId, amount, round, dueDate?)`** – optional helper to schedule manual contributions.
- **`getContributionsByGroup`, `getContributionsByMember`, `updateContributionStatus`, `getAllContributions`, `deleteContribution`** – CRUD utilities.

---

## Controllers
Controllers are thin wrappers that translate HTTP requests to service calls.

### controllers/userController.js
- `registerUser`, `loginUser` – call `AuthService` methods, transform errors.
- `getProfile` – fetches user by email from `req.user` payload.
- `submitVerification` – delegates to `UserService.submitVerificationRequest`.

### controllers/groupController.js
- `listGroups` / `getGroup` – return group data.
- `createGroup` – uses `GroupService.createGroup`, requires `req.authUser` from `requireVerified`.
- `joinGroup` – `GroupService.addMember` for `req.authUser`.
- `removeMember` – allows owner or member to remove membership.
- `startRound` – starts next payout round (owner only).
- `getRoundHistory` – returns `roundHistory` array.
- `applyPenalties` – admin-only wrapper around `CreditService.applyPenalties`.

### controllers/contributionController.js
- `listByGroup` – returns contributions populated with member + group.
- `payContribution` – marks a contribution as paid via `CreditService.recordContributionPayment`.

---

## Routers (for reference)
Routes are declared in `routes/*.js`; see `routes.md` for HTTP specifics. In summary:
- `/api/users` – register, login, profile, submit verification.
- `/api/groups` – list, create, join/leave, start rounds, fetch history, apply penalties.
- `/api/contributions` – list by group, pay contribution.

---

## Models (high-level)
While not functions, understanding key fields helps interpret service logic.
- `models/User.js` – includes `activeGroup`, `outstandingContributionCount`, verification metadata, and bcrypt hooks.
- `models/Group.js` – tracks members, reliability scores, payout order, messages, round history.
- `models/Contribution.js` – stores due dates, status, penalty flags.
- `models/Invitation.js`, `models/VerificationRequest.js`, etc. underpin Invitation/Verification services.

---

## Workflow Summary
1. **Auth** – users register/login via `AuthService`, get JWT, hit guarded routes with `authMiddleware`.
2. **Verification** – users submit ID/selfie data → auto face check → manual queue if needed.
3. **Groups** – verified users create/join groups. `CreditService.startNextRound` schedules contributions and chooses beneficiary order based on reliability.
4. **Payments & Penalties** – contributions are marked paid through `CreditService.recordContributionPayment`. Overdue entries are processed by `CreditService.applyPenalties`, which downgrades reliability score, bans chronic defaulters, and increases outstanding debt counters.
5. **Invitations** – `InvitationService` coordinates invite/join-request lifecycle (not yet exposed via routes).

Use this document as a quick refresher before modifying services or exposing new endpoints. For detailed HTTP payloads, see `routes.md`; for testing behavior, inspect the scripts in `tests/` (notably `creditSystemTest.js`).
