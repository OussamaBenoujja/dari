require('dotenv').config({ path: '../.env' });

const KC_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KC_REALM = process.env.KEYCLOAK_REALM || 'darna';
const KC_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'tirelire-api';
const KC_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';

function issuer() {
  return `${KC_URL}/realms/${KC_REALM}`;
}

function tokenEndpoint() {
  return `${issuer()}/protocol/openid-connect/token`;
}

function userinfoEndpoint() {
  return `${issuer()}/protocol/openid-connect/userinfo`;
}

function adminBase() {
  return `${KC_URL}/admin/realms/${KC_REALM}`;
}

module.exports = {
  KC_URL,
  KC_REALM,
  KC_CLIENT_ID,
  KC_CLIENT_SECRET,
  issuer,
  tokenEndpoint,
  userinfoEndpoint,
  adminBase,
};