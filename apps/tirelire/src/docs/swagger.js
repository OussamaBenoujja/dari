const serverUrl = process.env.TIRELIRE_SWAGGER_URL || "http://localhost:3002";

const bearerSecurity = [{ bearerAuth: [] }];

const responseWithData = (description, dataSchema) => ({
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

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Tirelire API",
    version: "1.0.0",
    description: "Documentation for collaborative savings and contribution workflows",
  },
  servers: [{ url: serverUrl, description: "Configured base URL" }],
  tags: [
    { name: "Users", description: "Profiles, verification, and help desk" },
    { name: "Groups", description: "Savings group orchestration" },
    { name: "Contributions", description: "Contribution tracking" },
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
      Ticket: {
        type: "object",
        properties: {
          _id: { type: "string" },
          subject: { type: "string" },
          status: { type: "string", enum: ["open", "pending", "closed"] },
          messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                author: { type: "string" },
                content: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
      VerificationRequest: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected"] },
          submittedAt: { type: "string", format: "date-time" },
        },
      },
      Group: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          contributionAmount: { type: "number" },
          contributionInterval: { type: "string", enum: ["weekly", "monthly"] },
          members: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      Contribution: {
        type: "object",
        properties: {
          _id: { type: "string" },
          groupId: { type: "string" },
          memberId: { type: "string" },
          amount: { type: "number" },
          dueDate: { type: "string", format: "date" },
          status: { type: "string", enum: ["pending", "paid", "late"] },
        },
      },
    },
  },
  paths: {
    "/api/users/register": {
      post: {
        tags: ["Users"],
        summary: "Deprecated legacy registration endpoint",
        deprecated: true,
        responses: {
          410: responseWithData("Deprecated", {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          }),
        },
      },
    },
    "/api/users/login": {
      post: {
        tags: ["Users"],
        summary: "Deprecated legacy login endpoint",
        deprecated: true,
        responses: {
          410: responseWithData("Deprecated", {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          }),
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Fetch Keycloak profile proxy",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Profile returned", {
            type: "object",
            additionalProperties: true,
          }),
        },
      },
    },
    "/api/users/verification": {
      post: {
        tags: ["Users"],
        summary: "Submit verification documents",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nationalId: { type: "string" },
                  proofOfIncome: { type: "string", description: "File URL" },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Verification queued", { $ref: "#/components/schemas/VerificationRequest" }),
        },
      },
    },
    "/api/users/verification/manual-queue": {
      get: {
        tags: ["Users"],
        summary: "List pending manual verification requests",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Queue", {
            type: "array",
            items: { $ref: "#/components/schemas/VerificationRequest" },
          }),
        },
      },
    },
    "/api/users/verification/{requestId}/manual-review": {
      post: {
        tags: ["Users"],
        summary: "Review a verification request",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "requestId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["approved", "rejected"] },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Review submitted", { $ref: "#/components/schemas/VerificationRequest" }),
        },
      },
    },
    "/api/users/notifications": {
      get: {
        tags: ["Users"],
        summary: "List notifications",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Notifications", {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string" },
                read: { type: "boolean" },
              },
            },
          }),
        },
      },
    },
    "/api/users/notifications/mark-read": {
      post: {
        tags: ["Users"],
        summary: "Mark notifications as read",
        security: bearerSecurity,
        requestBody: {
          required: false,
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
          204: { description: "Operation completed" },
        },
      },
    },
    "/api/users/tickets": {
      post: {
        tags: ["Users"],
        summary: "Open a ticket",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "message"],
                properties: {
                  subject: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Ticket created", { $ref: "#/components/schemas/Ticket" }),
        },
      },
      get: {
        tags: ["Users"],
        summary: "List my tickets",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Tickets", {
            type: "array",
            items: { $ref: "#/components/schemas/Ticket" },
          }),
        },
      },
    },
    "/api/users/tickets/all": {
      get: {
        tags: ["Users"],
        summary: "List all tickets (admin)",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Tickets", {
            type: "array",
            items: { $ref: "#/components/schemas/Ticket" },
          }),
        },
      },
    },
    "/api/users/tickets/{ticketId}/respond": {
      post: {
        tags: ["Users"],
        summary: "Respond to a ticket",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "ticketId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: responseWithData("Response added", { $ref: "#/components/schemas/Ticket" }),
        },
      },
    },
    "/api/users/stripe/onboard": {
      post: {
        tags: ["Users"],
        summary: "Start Stripe Connect onboarding",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Onboarding link", {
            type: "object",
            properties: {
              url: { type: "string", format: "uri" },
            },
          }),
        },
      },
    },
    "/api/users/stripe/complete": {
      get: {
        tags: ["Users"],
        summary: "Complete Stripe onboarding callback",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Stripe account synced"),
        },
      },
    },
    "/api/groups": {
      get: {
        tags: ["Groups"],
        summary: "List groups",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Groups", {
            type: "array",
            items: { $ref: "#/components/schemas/Group" },
          }),
        },
      },
      post: {
        tags: ["Groups"],
        summary: "Create a group",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "contributionAmount"],
                properties: {
                  name: { type: "string" },
                  contributionAmount: { type: "number" },
                  contributionInterval: { type: "string", enum: ["weekly", "monthly"] },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Group created", { $ref: "#/components/schemas/Group" }),
        },
      },
    },
    "/api/groups/actions/apply-penalties": {
      post: {
        tags: ["Groups"],
        summary: "Apply penalties across groups",
        security: bearerSecurity,
        responses: {
          200: responseWithData("Penalties applied"),
        },
      },
    },
    "/api/groups/{groupId}": {
      get: {
        tags: ["Groups"],
        summary: "Get group details",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Group", { $ref: "#/components/schemas/Group" }),
        },
      },
    },
    "/api/groups/{groupId}/join": {
      post: {
        tags: ["Groups"],
        summary: "Join a group",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Joined", { $ref: "#/components/schemas/Group" }),
        },
      },
    },
    "/api/groups/{groupId}/members/{memberId}": {
      delete: {
        tags: ["Groups"],
        summary: "Remove a member",
        security: bearerSecurity,
        parameters: [
          { in: "path", name: "groupId", required: true, schema: { type: "string" } },
          { in: "path", name: "memberId", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: responseWithData("Member removed"),
        },
      },
    },
    "/api/groups/{groupId}/start-round": {
      post: {
        tags: ["Groups"],
        summary: "Start next payout round",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Round started"),
        },
      },
    },
    "/api/groups/{groupId}/history": {
      get: {
        tags: ["Groups"],
        summary: "Get payout history",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("History", {
            type: "array",
            items: {
              type: "object",
              properties: {
                round: { type: "integer" },
                winner: { type: "string" },
                completedAt: { type: "string", format: "date-time" },
              },
            },
          }),
        },
      },
    },
    "/api/groups/{groupId}/messages": {
      post: {
        tags: ["Groups"],
        summary: "Send group message",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string" },
                  type: { type: "string", enum: ["text", "audio"], default: "text" },
                },
              },
            },
          },
        },
        responses: {
          201: responseWithData("Message sent"),
        },
      },
      get: {
        tags: ["Groups"],
        summary: "List group messages",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Messages", {
            type: "array",
            items: {
              type: "object",
              properties: {
                author: { type: "string" },
                content: { type: "string" },
                type: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          }),
        },
      },
    },
    "/api/contributions/group/{groupId}": {
      get: {
        tags: ["Contributions"],
        summary: "List contributions for a group",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "groupId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Contributions", {
            type: "array",
            items: { $ref: "#/components/schemas/Contribution" },
          }),
        },
      },
    },
    "/api/contributions/{contributionId}/pay": {
      post: {
        tags: ["Contributions"],
        summary: "Mark contribution as paid",
        security: bearerSecurity,
        parameters: [{ in: "path", name: "contributionId", required: true, schema: { type: "string" } }],
        responses: {
          200: responseWithData("Contribution updated", { $ref: "#/components/schemas/Contribution" }),
        },
      },
    },
  },
};

module.exports = swaggerDocument;
