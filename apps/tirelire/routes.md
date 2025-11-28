# API Routes Overview

This document summarizes the currently available REST endpoints, the purpose of each one, and the basic request payloads you can send. All routes are mounted under the base path `/api` in `src/app.js`.

> **Auth headers**
>
> - Routes marked as **Auth: required** expect an `Authorization: Bearer <token>` header using the JWT returned from the login or register endpoints.
> - Routes marked as **Verified** also require that the authenticated user has `isVerified === true`.

---

## Users (`/api/users`)

| Method & Path | Auth | Description | Body (JSON)
| --- | --- | --- | --- |
| `POST /register` | No | Create a new user account. | `{ "first_Name": "John", "last_Name": "Doe", "email": "user@example.com", "adress": "123 Street", "password": "secret1", "role": "user"? }`<br>\- `role` defaults to `user` if omitted.
| `POST /login` | No | Log in and receive a JWT. | `{ "email": "user@example.com", "password": "secret1" }`
| `GET /me` | Auth | Return the authenticated user's profile (password omitted). | _None_
| `POST /verification` | Auth | Submit a verification request (face/ID data). | `{ "verificationType": "passport", "idNumber": "AA123456", "idDocumentPath": "/path/to/id.jpg", "selfiePath": "/path/to/selfie.jpg" }`

---

## Groups (`/api/groups`)

_All group routes require authentication. Routes flagged as Verified demand a verified account._

| Method & Path | Auth | Verified | Description | Body (JSON)
| --- | --- | --- | --- | --- |
| `GET /` | Auth | No | List all groups with populated members and payout information. | _None_
| `POST /actions/apply-penalties` | Auth | Yes (admin recommended) | Trigger the penalty sweep (admin-only in practice). | _None_
| `POST /` | Auth | Yes | Create a new Dart group. | `{ "name": "Family Dart", "contributionAmount": 100, "contributionInterval": "monthly" }`
| `GET /:groupId` | Auth | No | Fetch a specific group with members, messages, and payout order. | _None_
| `POST /:groupId/join` | Auth | Yes | Join a group (enforces single-active-group + verification rules). | _None_
| `DELETE /:groupId/members/:memberId` | Auth | Yes | Remove a member or allow a member to leave (requires owner or self). | _None_
| `POST /:groupId/start-round` | Auth | Yes (creator) | Start the next payout round. | _None_
| `GET /:groupId/history` | Auth | Yes | View round history entries for the group. | _None_

---

## Contributions (`/api/contributions`)

_All contribution routes require authentication and a verified user._

| Method & Path | Auth | Verified | Description | Body (JSON)
| --- | --- | --- | --- | --- |
| `GET /group/:groupId` | Yes | Yes | List contribution records for a specific group. | _None_
| `POST /:contributionId/pay` | Yes | Yes | Mark a contribution as paid (records payment date, updates scores). | _None_

---

## Notes

- JSON bodies should be sent with `Content-Type: application/json`.
- Error responses use `{ "message": "...", "details": ... }` where `details` may hold validation errors.
- File paths for verification are currently expected as local filesystem paths accessible to the server; adapt as needed for actual storage.
