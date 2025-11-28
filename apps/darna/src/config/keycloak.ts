export const KC_URL = process.env.KEYCLOAK_URL || "http://localhost:8080";
export const KC_REALM = process.env.KEYCLOAK_REALM || "darna";
export const KC_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || "darna-api";
export const KC_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || "";
export const KC_ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || process.env.KEYCLOAK_USER || "admin";
export const KC_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || process.env.KEYCLOAK_PASSWORD || "admin";

export function kcIssuer() {
  return `${KC_URL}/realms/${KC_REALM}`;
}

export function kcTokenEndpoint() {
  return `${kcIssuer()}/protocol/openid-connect/token`;
}

export function kcUserinfoEndpoint() {
  return `${kcIssuer()}/protocol/openid-connect/userinfo`;
}

export function kcAdminBase() {
  return `${KC_URL}/admin/realms/${KC_REALM}`;
}
