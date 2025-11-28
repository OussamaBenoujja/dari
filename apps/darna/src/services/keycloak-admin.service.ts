import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  KC_URL,
  KC_REALM,
  KC_ADMIN_USER,
  KC_ADMIN_PASSWORD,
} from "../config/keycloak";

const ADMIN_REALM = process.env.KEYCLOAK_ADMIN_REALM || "master";
const ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || "admin-cli";
const KC_ADMIN_BASE = `${KC_URL}/admin/realms/${KC_REALM}`;

interface KeycloakUserRepresentation {
  id: string;
  email?: string;
  emailVerified?: boolean;
  requiredActions?: string[];
  credentials?: Array<{ id: string; type: string }>;
}

interface KeycloakCreateUserPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled?: boolean;
  emailVerified?: boolean;
}

interface RealmRoleRepresentation {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
}

class KeycloakAdminService {
  private static adminToken: { token: string; expiresAt: number } | null = null;

  private static async getAdminToken(): Promise<string> {
    const now = Date.now();
    if (this.adminToken && this.adminToken.expiresAt > now + 30_000) {
      return this.adminToken.token;
    }

    const tokenEndpoint = `${KC_URL}/realms/${ADMIN_REALM}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
      grant_type: "password",
      client_id: ADMIN_CLIENT_ID,
      username: KC_ADMIN_USER,
      password: KC_ADMIN_PASSWORD,
    });

    const response = await axios.post(tokenEndpoint, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const expiresIn = Number(response.data?.expires_in ?? 60);
    this.adminToken = {
      token: response.data.access_token,
      expiresAt: now + expiresIn * 1000,
    };

    return this.adminToken.token;
  }

  private static async kcAxios<T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const token = await this.getAdminToken();
    const headers = { Authorization: `Bearer ${token}`, ...(config.headers ?? {}) };
    return axios.request<T>({ ...config, headers });
  }

  private static async kcRequest<T = unknown>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: unknown,
    options?: AxiosRequestConfig,
  ) {
    const response = await this.kcAxios<T>({ method, url, data, ...(options ?? {}) });
    return response.data;
  }

  static async sendVerificationEmail(userId: string) {
    const url = `${KC_ADMIN_BASE}/users/${userId}/execute-actions-email`;
    await this.kcRequest("post", url, ["VERIFY_EMAIL"]);
  }

  static async listCredentials(userId: string) {
    const url = `${KC_ADMIN_BASE}/users/${userId}/credentials`;
    return this.kcRequest<Array<{ id: string; type: string }>>("get", url);
  }

  static async removeCredential(userId: string, credentialId: string) {
    const url = `${KC_ADMIN_BASE}/users/${userId}/credentials/${credentialId}`;
    await this.kcRequest("delete", url);
  }

  static async loadUser(userId: string) {
    const url = `${KC_ADMIN_BASE}/users/${userId}`;
    return this.kcRequest<KeycloakUserRepresentation>("get", url);
  }

  static async updateUser(userId: string, payload: Partial<KeycloakUserRepresentation>) {
    const url = `${KC_ADMIN_BASE}/users/${userId}`;
    await this.kcRequest("put", url, payload);
  }

  static async enableTotp(userId: string) {
    const user = await this.loadUser(userId);
    const requiredActions = new Set(user.requiredActions ?? []);
    requiredActions.add("CONFIGURE_TOTP");
    await this.updateUser(userId, { requiredActions: Array.from(requiredActions) });
  }

  static async disableTotp(userId: string) {
    const credentials = await this.listCredentials(userId);
    const totp = credentials.find((credential) => credential.type === "otp" || credential.type === "totp");
    if (totp) {
      await this.removeCredential(userId, totp.id);
    }
    const user = await this.loadUser(userId);
    const requiredActions = new Set(user.requiredActions ?? []);
    requiredActions.delete("CONFIGURE_TOTP");
    await this.updateUser(userId, { requiredActions: Array.from(requiredActions) });
  }

  static async findUserByUsername(username: string) {
    const users = await this.kcRequest<KeycloakUserRepresentation[]>(
      "get",
      `${KC_ADMIN_BASE}/users`,
      undefined,
      {
        params: { username },
      },
    );
    return users?.[0] ?? null;
  }

  static async findUserByEmail(email: string) {
    const users = await this.kcRequest<KeycloakUserRepresentation[]>(
      "get",
      `${KC_ADMIN_BASE}/users`,
      undefined,
      {
        params: { email },
      },
    );
    return users?.[0] ?? null;
  }

  static async createUser(payload: KeycloakCreateUserPayload) {
    const response = await this.kcAxios({
      method: "post",
      url: `${KC_ADMIN_BASE}/users`,
      data: payload,
      validateStatus: (status) => status === 201,
    });
    const location = response.headers.location as string | undefined;
    if (!location) {
      throw new Error("Keycloak did not return user id after creation");
    }
    return location.split("/").pop() as string;
  }

  static async setUserPassword(userId: string, password: string, temporary = false) {
    await this.kcRequest(
      "put",
      `${KC_ADMIN_BASE}/users/${userId}/reset-password`,
      {
        type: "password",
        value: password,
        temporary,
      },
    );
  }

  static async getRealmRole(roleName: string) {
    try {
      return await this.kcRequest<RealmRoleRepresentation>("get", `${KC_ADMIN_BASE}/roles/${roleName}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async ensureRealmRole(roleName: string) {
    const role = await this.getRealmRole(roleName);
    if (role) {
      return role;
    }
    await this.kcRequest("post", `${KC_ADMIN_BASE}/roles`, { name: roleName });
    return this.getRealmRole(roleName);
  }

  static async assignRealmRole(userId: string, roleName: string) {
    const role = await this.ensureRealmRole(roleName);
    if (!role) {
      throw new Error(`Unable to resolve realm role ${roleName}`);
    }
    await this.kcRequest(
      "post",
      `${KC_ADMIN_BASE}/users/${userId}/role-mappings/realm`,
      [{ id: role.id, name: role.name }],
    );
  }

  static async markEmailVerified(userId: string) {
    await this.updateUser(userId, { emailVerified: true });
  }
}

export default KeycloakAdminService;
