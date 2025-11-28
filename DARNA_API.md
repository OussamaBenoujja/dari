# Darna API Reference

Comprehensive summary of the Darna backend so the frontend team can integrate without constantly digging through Swagger. The live Swagger UI remains available at `http://localhost:3001/api/docs` whenever the API is running.

## Quick facts

| Item | Value |
| ---- | ----- |
| Base URL (local) | `http://localhost:3001` |
| Docs | `http://localhost:3001/api/docs` |
| Auth Provider | Keycloak (`realm=darna`, client=`darna-api`) |
| Default roles | `individual`, `business`, `admin` |
| Auth header | `Authorization: Bearer <access_token>` |

### Getting a token
1. **Register** via `POST /api/auth/register` (body: `email`, `password`, `confirmPassword`, `firstName`, `lastName`, optional `accountType`). Response returns Keycloak `access_token` / `refresh_token` pair.
2. **Login** via `POST /api/auth/login` with `username` (email) + `password` to refresh tokens later on.
3. **Refresh** via `POST /api/auth/refresh` with `refresh_token`.

> Every route listed below, unless stated otherwise, requires the Bearer token.

## Endpoint catalogue

### Auth
| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/register` | Creates Keycloak-backed user and returns tokens. |
| POST | `/api/auth/login` | Password grant against Keycloak. |
| POST | `/api/auth/refresh` | Exchange refresh token for new access token. |
| GET | `/api/auth/me` | Proxies Keycloak userinfo. |
| POST | `/api/auth/verify-email` | Sends verify-email action. |
| GET | `/api/auth/2fa/status` | Returns `{ enabled: boolean }`. |
| POST | `/api/auth/2fa/enable` | Adds Keycloak TOTP requirement. |
| POST | `/api/auth/2fa/disable` | Removes TOTP. |
| GET | `/api/auth/privacy/export` | Exports stored profile. |
| DELETE | `/api/auth/privacy` | Flags account for deletion. |

### Real-Estate Listings
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/realEstate` | Paginated list (`page`, `limit`). |
| GET | `/api/realEstate/search` | Same list with filters like `minPrice`, `maxPrice`, `city`, `q`. |
| GET | `/api/realEstate/{id}` | Single listing. |
| POST | `/api/realEstate` | Creates listing. Required fields: `title`, `description`, `price`, `currency`, `transactionType`, `location`. Ownership inferred from token. |
| PATCH | `/api/realEstate/{id}` | Update (owner/admin only). |
| DELETE | `/api/realEstate/{id}` | Delete listing. |
| POST | `/api/realEstate/{id}/estimate` | AI-powered price estimation (calls OpenRouter, returns `{minPrice,maxPrice,currency,confidence,reasoning}`). |
| POST | `/api/realEstate/{id}/media` | `multipart/form-data` upload with `file`. Returns CDN URLs. |
| DELETE | `/api/realEstate/{id}/media/{mediaId}` | Removes media object. |

### User Assets
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/users/me/profile-image` | Uploads avatar (`file`). |
| POST | `/api/users/me/banner-image` | Uploads profile banner (`file`). |

### Subscriptions
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/subscriptions/plans` | List available tiers (`free`, `pro`, etc.). |
| GET | `/api/subscriptions/me` | Current user subscription snapshot. |
| POST | `/api/subscriptions/assign` | Body `{ "planId": string }`. |

### Chat / Messaging
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/chat/conversations` | Conversations for current user. |
| GET | `/api/chat/conversations/{conversationId}` | Conversation metadata. |
| GET | `/api/chat/conversations/{conversationId}/messages` | Paginated message history. |
| POST | `/api/chat/conversations/{conversationId}/read` | Marks conversation read. |
| POST | `/api/chat/attachments` | Uploads attachment for later message use (`file`). |

### Notifications
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/notifications` | Returns list with read status. |
| POST | `/api/notifications/read` | Body `{ ids: string[] }` to mark specific notifications. |
| POST | `/api/notifications/read-all` | Marks all as read. |

### Leads
| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/leads` | Body `{ realEstateId, message }` to contact an owner. |
| GET | `/api/leads/buyer` | Leads initiated by current user. |
| GET | `/api/leads/owner` | Leads targeting listings owned by current user. |
| PATCH | `/api/leads/{leadId}/status` | Body `{ status: "new"|... }` to update pipeline stage. |

### Financing
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/financing/banks` | Static list of supported banks. |
| POST | `/api/financing/simulate` | Body `{ amount, tenureYears, rate }` -> repayment schedule. |
| POST | `/api/financing/applications` | Submit mortgage dossier (`realEstateId`, `bankId`, financials, doc URLs). |
| GET | `/api/financing/applications` | Applications created by current user. |
| POST | `/api/financing/tirelire/proposal` | Body `{ tirelireGroupId, realEstateId, notes }` to sync with Tirelire. |

### Admin
| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/admin/metrics` | Platform KPIs. |
| POST | `/api/admin/notifications/broadcast` | Body `{ title, body, filters? }` queue broadcast push/email. |
| POST | `/api/admin/subscriptions/process-renewals` | Triggers billing cron manually. |

## Sample flows

### Create a listing and request AI price
```http
POST /api/realEstate HTTP/1.1
Host: localhost:3001
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Cozy studio",
  "description": "Near downtown, 35m²",
  "price": 900000,
  "currency": "MAD",
  "transactionType": "sale",
  "location": {
    "address": "123 Main St",
    "city": "Casablanca",
    "country": "MA",
    "coordinates": { "latitude": 33.6, "longitude": -7.6 }
  }
}
```
Then:
```http
POST /api/realEstate/{realEstateId}/estimate HTTP/1.1
Authorization: Bearer <token>
```
Response example:
```json
{
  "success": true,
  "message": "Price estimation generated successfully",
  "data": {
    "minPrice": 870000,
    "maxPrice": 940000,
    "currency": "MAD",
    "confidence": 0.78,
    "reasoning": "Price aligns with comparable downtown studios"
  }
}
```

### Notifications lifecycle
1. `GET /api/notifications` → show unread count.
2. User reads details → `POST /api/notifications/read` with `ids`.
3. Optional “mark all read” button → `POST /api/notifications/read-all`.

## Error format
Most controllers bubble up `ServiceError`, so failures look like:
```json
{
  "success": false,
  "message": "Human readable message",
  "errors": [
    { "message": "validation issue", "path": "body.field" }
  ]
}
```

Keep this doc handy when wiring the frontend; refer to Swagger for field-level details or schema updates.
