const serverUrl = process.env.SWAGGER_SERVER_URL || "http://localhost:3001";

const bearerSecurity = [{ bearerAuth: [] }];

type Schema = Record<string, unknown>;

const responseWithData = (description: string, dataSchema?: Schema) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          ...(dataSchema ? { data: dataSchema } : {}),
        },
      },
    },
  },
});

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                message: { type: "string" },
                path: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

const paginationSchema = {
  type: "object",
  properties: {
    currentPage: { type: "integer", minimum: 1 },
    totalPages: { type: "integer", minimum: 1 },
    totalCount: { type: "integer", minimum: 0 },
    limit: { type: "integer", minimum: 1 },
    hasNextPage: { type: "boolean" },
    hasPrevPage: { type: "boolean" },
  },
};

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Darna API",
    description: "Comprehensive documentation for the Darna real-estate platform",
    version: "1.0.0",
  },
  servers: [{ url: serverUrl, description: "Configured base URL" }],
  tags: [
    { name: "Auth", description: "Keycloak-backed authentication" },
    { name: "RealEstate", description: "Real estate listings" },
    { name: "Media", description: "Media handling" },
    { name: "Users", description: "Profile assets" },
    { name: "Subscriptions", description: "Subscription management" },
    { name: "Chat", description: "Conversation APIs" },
    { name: "Notifications", description: "Notification center" },
    { name: "Leads", description: "Lead lifecycle" },
    { name: "Financing", description: "Financing calculators and applications" },
    { name: "Admin", description: "Administrative tooling" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      AuthTokens: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          refresh_token: { type: "string" },
          expires_in: { type: "integer" },
          refresh_expires_in: { type: "integer" },
          token_type: { type: "string" },
          scope: { type: "string" },
        },
      },
      RealEstateLocation: {
        type: "object",
        properties: {
          address: { type: "string" },
          city: { type: "string" },
          country: { type: "string" },
          coordinates: {
            type: "object",
            properties: {
              latitude: { type: "number" },
              longitude: { type: "number" },
            },
          },
        },
      },
      RealEstateInput: {
        type: "object",
        required: ["title", "description", "price", "currency", "transactionType", "location"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          currency: { type: "string", example: "MAD" },
          transactionType: { type: "string", enum: ["rent", "sale"] },
          availability: { type: "boolean" },
          availableFrom: { type: "string", format: "date" },
          location: { $ref: "#/components/schemas/RealEstateLocation" },
          media: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri" },
                key: { type: "string" },
              },
            },
          },
        },
      },
      RealEstate: {
        allOf: [
          { $ref: "#/components/schemas/RealEstateInput" },
          {
            type: "object",
            properties: {
              _id: { type: "string" },
              owner: { type: "string" },
              visibilityTier: { type: "string" },
              visibilityScore: { type: "number" },
              priceEstimation: {
                type: "object",
                properties: {
                  minPrice: { type: "number" },
                  maxPrice: { type: "number" },
                  currency: { type: "string" },
                  confidence: { type: "number" },
                  reasoning: { type: "string" },
                },
              },
            },
          },
        ],
      },
      Lead: {
        type: "object",
        properties: {
          _id: { type: "string" },
          realEstateId: { type: "string" },
          buyerId: { type: "string" },
          ownerId: { type: "string" },
          status: { type: "string", enum: ["new", "contacted", "qualified", "closed", "archived"] },
          notes: { type: "string" },
        },
      },
      FinancingSimulationRequest: {
        type: "object",
        required: ["amount", "tenureYears", "rate"],
        properties: {
          amount: { type: "number" },
          tenureYears: { type: "integer" },
          rate: { type: "number" },
        },
      },
      FinancingApplicationRequest: {
        type: "object",
        required: ["realEstateId", "bankId", "monthlyIncome"],
        properties: {
          realEstateId: { type: "string" },
          bankId: { type: "string" },
          monthlyIncome: { type: "number" },
          documents: {
            type: "array",
            items: { type: "string", format: "uri" },
          },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      SubscriptionPlan: {
        type: "object",
        properties: {
          name: { type: "string" },
          tier: { type: "string" },
          price: { type: "number" },
          currency: { type: "string" },
        },
      },
      ChatConversation: {
        type: "object",
        properties: {
          _id: { type: "string" },
          participants: {
            type: "array",
            items: { type: "string" },
          },
          lastMessageAt: { type: "string", format: "date-time" },
        },
      },
      ChatMessage: {
        type: "object",
        properties: {
          _id: { type: "string" },
          conversationId: { type: "string" },
          senderId: { type: "string" },
          body: { type: "string" },
          attachments: {
            type: "array",
            items: { type: "string", format: "uri" },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new Keycloak user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "confirmPassword", "firstName", "lastName"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  confirmPassword: { type: "string", minLength: 6 },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  accountType: { type: "string", enum: ["individual", "business"], default: "individual" },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Account created", { $ref: "#/components/schemas/AuthTokens" }),
          400: errorResponse("Validation failed"),
          409: errorResponse("Account already exists"),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Exchange username/password for tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Tokens issued", { $ref: "#/components/schemas/AuthTokens" }),
          401: errorResponse("Invalid credentials"),
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh an access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refresh_token"],
                properties: {
                  refresh_token: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Token refreshed", { $ref: "#/components/schemas/AuthTokens" }),
          401: errorResponse("Invalid refresh token"),
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Return decoded Keycloak profile",
        security: bearerSecurity,
        responses: {
          200: responseWithData("User info returned", {
            type: "object",
            additionalProperties: true,
          }),
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Send a verification email",
        security: bearerSecurity,
        responses: {
          204: { description: "Email queued" },
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/auth/2fa/status": {
      get: {
        tags: ["Auth"],
        summary: "Check two-factor status",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Status returned", {
            type: "object",
            properties: {
              enabled: { type: "boolean" },
            },
          }),
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/auth/2fa/enable": {
      post: {
        tags: ["Auth"],
        summary: "Enable two-factor authentication",
        security: bearerSecurity,
        responses: {
          204: { description: "Two-factor enabled" },
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/auth/2fa/disable": {
      post: {
        tags: ["Auth"],
        summary: "Disable two-factor authentication",
        security: bearerSecurity,
        responses: {
          204: { description: "Two-factor disabled" },
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/auth/privacy/export": {
      get: {
        tags: ["Auth"],
        summary: "Export profile data",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Export generated", {
            type: "object",
            additionalProperties: true,
          }),
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/auth/privacy": {
      delete: {
        tags: ["Auth"],
        summary: "Delete profile data",
        security: bearerSecurity,
        responses: {
          204: { description: "Profile scheduled for deletion" },
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/realEstate": {
      get: {
        tags: ["RealEstate"],
        summary: "List listings",
        security: bearerSecurity,
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 10 } },
        ],
        responses: {
          200: responseWithData("Listings returned", {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/RealEstate" },
              },
              pagination: paginationSchema,
            },
          }),
          401: errorResponse("Unauthorized"),
        },
      },
      post: {
        tags: ["RealEstate"],
        summary: "Create a listing",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RealEstateInput" },
            },
          },
        },
        responses: {
          201: responseWithData("Listing created", { $ref: "#/components/schemas/RealEstate" }),
          400: errorResponse("Validation failed"),
        },
      },
    },
    "/api/realEstate/search": {
      get: {
        tags: ["RealEstate"],
        summary: "Search listings with filters",
        security: bearerSecurity,
        parameters: [
          { in: "query", name: "q", schema: { type: "string" } },
          { in: "query", name: "minPrice", schema: { type: "number" } },
          { in: "query", name: "maxPrice", schema: { type: "number" } },
          { in: "query", name: "city", schema: { type: "string" } },
        ],
        responses: {
          200: responseWithData("Filtered results", {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/RealEstate" },
              },
              pagination: paginationSchema,
            },
          }),
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/realEstate/{realEstateId}": {
      get: {
        tags: ["RealEstate"],
        summary: "Get a single listing",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "realEstateId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Listing returned", { $ref: "#/components/schemas/RealEstate" }),
          404: errorResponse("Not found"),
        },
      },
      patch: {
        tags: ["RealEstate"],
        summary: "Update listing",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "realEstateId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RealEstateInput" },
            },
          },
        },
        responses: {
          200: responseWithData("Listing updated", { $ref: "#/components/schemas/RealEstate" }),
          404: errorResponse("Not found"),
        },
      },
      delete: {
        tags: ["RealEstate"],
        summary: "Delete listing",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "realEstateId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Listing removed"),
          404: errorResponse("Not found"),
        },
      },
    },
    "/api/realEstate/{realEstateId}/estimate": {
      post: {
        tags: ["RealEstate"],
        summary: "Request AI price estimation",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "realEstateId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Estimation generated", {
            type: "object",
            properties: {
              minPrice: { type: "number" },
              maxPrice: { type: "number" },
              currency: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" },
            },
          }),
          400: errorResponse("Estimation failed"),
        },
      },
    },
    "/api/realEstate/{realEstateId}/media": {
      post: {
        tags: ["Media"],
        summary: "Upload media to listing",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "realEstateId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Media uploaded", {
            type: "object",
            properties: {
              url: { type: "string" },
              thumbnailUrl: { type: "string" },
            },
          }),
          400: errorResponse("Upload failed"),
        },
      },
    },
    "/api/realEstate/{realEstateId}/media/{mediaId}": {
      delete: {
        tags: ["Media"],
        summary: "Remove media item",
        security: bearerSecurity,
        parameters: [
          { in: "path", name: "realEstateId", required: true, schema: { type: "string" } },
          { in: "path", name: "mediaId", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: responseWithData("Media deleted"),
          404: errorResponse("Media not found"),
        },
      },
    },
    "/api/users/me/profile-image": {
      post: {
        tags: ["Users"],
        summary: "Upload profile image",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Profile updated", {
            type: "object",
            properties: {
              url: { type: "string" },
            },
          }),
          401: errorResponse("Unauthorized"),
        },
      },
    },
    "/api/users/me/banner-image": {
      post: {
        tags: ["Users"],
        summary: "Upload banner image",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Banner updated", {
            type: "object",
            properties: {
              url: { type: "string" },
            },
          }),
        },
      },
    },
    "/api/subscriptions/plans": {
      get: {
        tags: ["Subscriptions"],
        summary: "List available plans",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Plans", {
            type: "array",
            items: { $ref: "#/components/schemas/SubscriptionPlan" },
          }),
        },
      },
    },
    "/api/subscriptions/me": {
      get: {
        tags: ["Subscriptions"],
        summary: "Fetch current subscription",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Current subscription", {
            type: "object",
            additionalProperties: true,
          }),
        },
      },
    },
    "/api/subscriptions/assign": {
      post: {
        tags: ["Subscriptions"],
        summary: "Assign plan to user",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["planId"],
                properties: {
                  planId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Plan assigned"),
          400: errorResponse("Assignment failed"),
        },
      },
    },
    "/api/chat/conversations": {
      get: {
        tags: ["Chat"],
        summary: "List conversations",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Conversations", {
            type: "array",
            items: { $ref: "#/components/schemas/ChatConversation" },
          }),
        },
      },
    },
    "/api/chat/conversations/{conversationId}": {
      get: {
        tags: ["Chat"],
        summary: "Get conversation details",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "conversationId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Conversation", { $ref: "#/components/schemas/ChatConversation" }),
          404: errorResponse("Conversation not found"),
        },
      },
    },
    "/api/chat/conversations/{conversationId}/messages": {
      get: {
        tags: ["Chat"],
        summary: "List messages in a conversation",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "conversationId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Messages", {
            type: "array",
            items: { $ref: "#/components/schemas/ChatMessage" },
          }),
        },
      },
    },
    "/api/chat/conversations/{conversationId}/read": {
      post: {
        tags: ["Chat"],
        summary: "Mark conversation as read",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "conversationId", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Conversation marked as read" },
        },
      },
    },
    "/api/chat/attachments": {
      post: {
        tags: ["Chat"],
        summary: "Upload chat attachment",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Attachment uploaded", {
            type: "object",
            properties: {
              url: { type: "string" },
              type: { type: "string" },
            },
          }),
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Notifications", {
            type: "array",
            items: { $ref: "#/components/schemas/Notification" },
          }),
        },
      },
    },
    "/api/notifications/read": {
      post: {
        tags: ["Notifications"],
        summary: "Mark selected notifications as read",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  ids: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          204: { description: "Marked as read" },
        },
      },
    },
    "/api/notifications/read-all": {
      post: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        security: bearerSecurity,
        responses: {
          204: { description: "All notifications marked as read" },
        },
      },
    },
    "/api/leads": {
      post: {
        tags: ["Leads"],
        summary: "Create a lead",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["realEstateId", "message"],
                properties: {
                  realEstateId: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Lead created", { $ref: "#/components/schemas/Lead" }),
        },
      },
    },
    "/api/leads/buyer": {
      get: {
        tags: ["Leads"],
        summary: "List leads for authenticated buyer",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Buyer leads", {
            type: "array",
            items: { $ref: "#/components/schemas/Lead" },
          }),
        },
      },
    },
    "/api/leads/owner": {
      get: {
        tags: ["Leads"],
        summary: "List leads for current owner",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Owner leads", {
            type: "array",
            items: { $ref: "#/components/schemas/Lead" },
          }),
        },
      },
    },
    "/api/leads/{leadId}/status": {
      patch: {
        tags: ["Leads"],
        summary: "Update lead status",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "leadId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["new", "contacted", "qualified", "closed", "archived"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Lead updated", { $ref: "#/components/schemas/Lead" }),
        },
      },
    },
    "/api/financing/banks": {
      get: {
        tags: ["Financing"],
        summary: "List partner banks",
        responses: {
          200: responseWithData("Banks", {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
          }),
        },
      },
    },
    "/api/financing/simulate": {
      post: {
        tags: ["Financing"],
        summary: "Simulate a mortgage",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FinancingSimulationRequest" },
            },
          },
        },
        responses: {
          200: responseWithData("Simulation result", {
            type: "object",
            properties: {
              monthlyPayment: { type: "number" },
              totalInterest: { type: "number" },
            },
          }),
        },
      },
    },
    "/api/financing/applications": {
      post: {
        tags: ["Financing"],
        summary: "Submit financing application",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FinancingApplicationRequest" },
            },
          },
        },
        responses: {
          201: responseWithData("Application submitted", {
            type: "object",
            additionalProperties: true,
          }),
        },
      },
      get: {
        tags: ["Financing"],
        summary: "List my applications",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Applications", {
            type: "array",
            items: { type: "object", additionalProperties: true },
          }),
        },
      },
    },
    "/api/financing/tirelire/proposal": {
      post: {
        tags: ["Financing"],
        summary: "Send Tirelire proposal",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tirelireGroupId", "realEstateId"],
                properties: {
                  tirelireGroupId: { type: "string" },
                  realEstateId: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Proposal queued"),
        },
      },
    },
    "/api/admin/metrics": {
      get: {
        tags: ["Admin"],
        summary: "Platform metrics",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Metrics", {
            type: "object",
            additionalProperties: true,
          }),
        },
      },
    },
    "/api/admin/notifications/broadcast": {
      post: {
        tags: ["Admin"],
        summary: "Alias for notification broadcast",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "body"],
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          202: responseWithData("Broadcast queued"),
        },
      },
    },
    "/api/admin/subscriptions/process-renewals": {
      post: {
        tags: ["Admin"],
        summary: "Trigger subscription renewals",
        security: bearerSecurity,
        responses: {
          202: responseWithData("Renewals job started"),
        },
      },
    },
  },
};

export default swaggerDocument;
