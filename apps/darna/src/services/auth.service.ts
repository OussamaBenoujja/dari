import axios from "axios";
import KeycloakAdminService from "./keycloak-admin.service";
import { ServiceError } from "./realEstate.service";
import { KC_CLIENT_ID, KC_CLIENT_SECRET, kcTokenEndpoint, kcUserinfoEndpoint } from "../config/keycloak";
import UserService, { KeycloakTokenPayload } from "./user.service";

type AccountTypeInput = "individual" | "business";

interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: AccountTypeInput;
}

class AuthService {
  static async registerUser(input: RegisterUserInput) {
    const email = input.email?.toLowerCase?.();
    if (!email) {
      throw new ServiceError("Email is required", 400);
    }

    const password = input.password;
    if (!password) {
      throw new ServiceError("Password is required", 400);
    }

    const { firstName, lastName, accountType } = input;
    if (!firstName || !lastName) {
      throw new ServiceError("First name and last name are required", 400);
    }

    const username = email;

    const existing = (await KeycloakAdminService.findUserByUsername(username))
      ?? (await KeycloakAdminService.findUserByEmail(email));
    if (existing) {
      throw new ServiceError("An account with this email already exists", 409);
    }

    const userId = await KeycloakAdminService.createUser({
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: false,
    });

    await KeycloakAdminService.setUserPassword(userId, password, false);

    if (accountType === "business") {
      await KeycloakAdminService.ensureRealmRole("business");
      await KeycloakAdminService.assignRealmRole(userId, "business");
    }

    const tokens = await this.exchangePasswordGrant(username, password);
    await this.syncUserProfile(tokens.access_token);

    return tokens;
  }

  private static async exchangePasswordGrant(username: string, password: string) {
    const params = new URLSearchParams({
      grant_type: "password",
      client_id: KC_CLIENT_ID,
      username,
      password,
    });
    if (KC_CLIENT_SECRET) {
      params.set("client_secret", KC_CLIENT_SECRET);
    }

    try {
      const response = await axios.post(kcTokenEndpoint(), params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data;
    } catch (error: unknown) {
      throw new ServiceError("Failed to exchange credentials with Keycloak", 502);
    }
  }

  private static async syncUserProfile(accessToken: string) {
    try {
      const response = await axios.get<KeycloakTokenPayload>(kcUserinfoEndpoint(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await UserService.findOrCreateByKeycloakPayload(response.data ?? {});
    } catch (error: unknown) {
      // Swallow errors so registration succeeds even if userinfo call fails
    }
  }
}

export default AuthService;
