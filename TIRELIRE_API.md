# Tirelire API Reference

Concise guide for integrating the collaborative savings backend from the frontend. Swagger UI remains at `http://localhost:3002/api-docs`.

## Quick facts

| Item | Value |
| ---- | ----- |
| Base URL (local) | `http://localhost:3002` |
| Docs | `http://localhost:3002/api-docs` |
| Auth | Keycloak Bearer tokens (same realm as Darna). Use `/api/auth/...` on Darna or the Keycloak token endpoint to obtain tokens. |
| Headers | `Authorization: Bearer <token>` |

> Legacy `/api/users/register` & `/api/users/login` now return `410 Gone` and should not be used.

## Endpoint catalogue

### Users & Verification
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/users/me` | Returns Keycloak profile and Tirelire metadata for the current user. |
| POST | `/api/users/verification` | Submit verification payload (IDs, docs). |
| GET | `/api/users/verification/manual-queue` | Admin-only queue of pending verifications. |
| POST | `/api/users/verification/{requestId}/manual-review` | Admin decision body `{ status: "approved" | "rejected", notes? }`. |

### Notifications
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/users/notifications` | List notifications. |
| POST | `/api/users/notifications/mark-read` | Optional body `{ ids: string[] }`. Without body marks all. |

### Support tickets
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/users/tickets` | Body `{ subject, message }`. |
| GET | `/api/users/tickets` | Tickets opened by the current user. |
| GET | `/api/users/tickets/all` | Admin-only full list. |
| POST | `/api/users/tickets/{ticketId}/respond` | Body `{ message }` to append staff response. |

### Stripe onboarding
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/users/stripe/onboard` | Returns `{ url }` for Stripe Connect onboarding. |
| GET | `/api/users/stripe/complete` | Callback to finalize onboarding.

### Groups lifecycle
_All routes require auth; some require `requireVerified` middleware (user must have approved verification)._ 

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/groups` | List groups visible to the user. |
| POST | `/api/groups` | Create group (body requires `name`, `contributionAmount`, optional `contributionInterval`). Requires verified user. |
| POST | `/api/groups/actions/apply-penalties` | Batch job to apply late penalties (verified). |
| GET | `/api/groups/{groupId}` | Group details, membership, schedule. |
| POST | `/api/groups/{groupId}/join` | Join group (verified). |
| DELETE | `/api/groups/{groupId}/members/{memberId}` | Remove member (verified owner/admin). |
| POST | `/api/groups/{groupId}/start-round` | Start next payout round (verified). |
| GET | `/api/groups/{groupId}/history` | Round history timeline. |

#### Group messaging
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/groups/{groupId}/messages` | Body `{ content, type="text" | "audio" }` to send chat message. |
| GET | `/api/groups/{groupId}/messages` | Conversation log for the group. |

### Contributions
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/contributions/group/{groupId}` | List member contributions for a group (requires verified membership). |
| POST | `/api/contributions/{contributionId}/pay` | Mark contribution as paid (triggers settlement logic). |

## Request/response cheatsheet

### Submit verification
```http
POST /api/users/verification HTTP/1.1
Host: localhost:3002
Authorization: Bearer <token>
Content-Type: application/json

{
  "nationalId": "EE123456",
  "proofOfIncome": "https://cdn.example.com/docs/paystub.pdf"
}
```
Response example:
```json
{
  "success": true,
  "message": "Verification queued",
  "data": {
    "_id": "...",
    "status": "pending",
    "submittedAt": "2025-11-24T09:42:00Z"
  }
}
```

### Group chat message
```http
POST /api/groups/abc123/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Don’t forget tonight’s meeting!",
  "type": "text"
}
```

### Contribution payment
```http
POST /api/contributions/cont456/pay
Authorization: Bearer <token>
```
Response:
```json
{
  "success": true,
  "message": "Contribution updated",
  "data": {
    "status": "paid",
    "paidAt": "2025-11-24T09:45:12.000Z"
  }
}
```

## Error format
Express middleware returns errors shaped like:
```json
{
  "message": "Route not found"
}
```
or when validations fail:
```json
{
  "message": "Validation error",
  "errors": [
    { "field": "content", "message": "Required" }
  ]
}
```

Keep this Markdown reference handy during frontend work; the Swagger page provides fully typed schemas if deeper detail is needed.
