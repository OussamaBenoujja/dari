import User, { AccountType, SubscriptionTier } from "../models/user";

export interface KeycloakTokenPayload {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
}

const inferAccountType = (roles: string[] = []): AccountType => {
  if (roles.includes("admin")) {
    return "admin";
  }
  if (roles.includes("business") || roles.includes("enterprise")) {
    return "business";
  }
  return "individual";
};

const defaultTierForAccount = (accountType: AccountType): SubscriptionTier => {
  if (accountType === "business") {
    return "pro";
  }
  if (accountType === "admin") {
    return "premium";
  }
  return "free";
};

class UserService {
  static async findOrCreateByKeycloakPayload(payload: KeycloakTokenPayload) {
    const keycloakId = payload.sub;
    if (!keycloakId) {
      throw new Error("Invalid token: missing subject identifier");
    }

    const rolesFromRealm = payload.realm_access?.roles ?? [];
    const rolesFromResources = Object.values(payload.resource_access ?? {}).flatMap((resource) => resource.roles ?? []);
    const roles = Array.from(new Set([...rolesFromRealm, ...rolesFromResources]));
    const accountType = inferAccountType(roles);

    const update = {
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles,
      accountType,
    };

    const user = await User.findOneAndUpdate(
      { keycloakId },
      {
        $setOnInsert: {
          subscriptionTier: defaultTierForAccount(accountType),
          subscriptionStatus: "inactive",
          visibilityBoost: 0,
        },
        $set: update,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return user;
  }
}

export default UserService;
