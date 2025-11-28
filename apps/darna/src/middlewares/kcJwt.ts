import axios from "axios";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { KeycloakTokenPayload } from "../services/user.service";

let client: any = null;

function issuerUrl() {
  if (!process.env.KEYCLOAK_URL || !process.env.KEYCLOAK_REALM) return "";
  return `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;
}

function ensureClient() {
  if (!client) {
    const url = issuerUrl();
    if (!url) return null;
    client = jwksClient({ jwksUri: `${url}/protocol/openid-connect/certs` });
  }
  return client;
}

function getKey(header: any, cb: any) {
  const active = ensureClient();
  if (!active) return cb(new Error("JWKS client not ready"));
  active.getSigningKey(header.kid, (err: any, key: any) => {
    if (err) return cb(err);
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

export async function verifyKeycloakToken(token: string): Promise<KeycloakTokenPayload> {
  const issuer = issuerUrl();
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ["RS256"], issuer }, (err: any, decoded: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(decoded as KeycloakTokenPayload);
    });
  });
}

export async function kcProtect(req: any, res: any, next: any) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "No token" });
  }
  const token = parts[1];
  try {
    const decoded = await verifyKeycloakToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Bad token" });
  }
}

export async function kcUserInfo(req: any, res: any) {
  try {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");
    if (parts.length !== 2) return res.status(401).json({ message: "No token" });
    const token = parts[1];
    const issuer = issuerUrl();
    if (!issuer) return res.status(500).json({ message: "issuer missing" });
    const url = `${issuer}/protocol/openid-connect/userinfo`;
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    res.json(r.data);
  } catch (e: any) {
    res.status(500).json({ message: "cant get user info", error: e.message });
  }
}
