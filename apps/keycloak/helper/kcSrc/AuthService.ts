
const keycloak_URL = process.env.KEYCLOAK_URL!;
const keycloak_Realm = process.env.KEYCLOAK_REALM!;
const keycloak_user = process.env.KEYCLOAK_USER!;
const keycloak_password = process.env.KEYCLOAK_PASSWORD!;

export class KeyCloackService {
  //this one is to gernerate usble keycloack token for SSO managment
  private static async getAdminToken(): Promise<string> {
    const url = `${keycloak_URL}/realms/master/protocol/openid-connect/token`;
    const params = {
      grant_type: "password",
      client_id: "admin-cli",
      username: keycloak_user,
      password: keycloak_password,
    };
    const body = new URLSearchParams(params).toString();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok)
      throw new Error("faild to fetch Admin Token\n" + res.statusText);
    const data = await res.json();
    return data.access_token;
  }

  //welp for this one the function name says waht it does
  static async registerUser({
    username,
    email,
    password,
    firstName,
    lastName,
  }: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const kcToken = await this.getAdminToken();

    const payload = {
      username,
      email,
      enabled: true,
      firstName,
      lastName,
      credentials: [{ type: "password", value: password, temporary: false }],
    };

    const res = await fetch(
      `${keycloak_URL}/admin/realms/${keycloak_Realm}/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kcToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Failed to create user: ${res.status} ${msg}`);
    }
  }

  static async loginUser(username: string, password: string) {
    const url = `${keycloak_URL}/realms/${keycloak_Realm}/protocol/openid-connect/token`;

    const params = {
      grant_type: "password",
      client_id: "admin-cli",
      username,
      password,
    };

    const body = new URLSearchParams(params).toString();

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Failed to login: ${res.status} ${msg}`);
    }

    const data = await res.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    };
  }
}
