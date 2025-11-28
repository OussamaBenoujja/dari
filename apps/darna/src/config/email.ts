export const SMTP_HOST = process.env.SMTP_HOST || "localhost";
export const SMTP_PORT = Number(process.env.SMTP_PORT || 1025);
export const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
export const SMTP_FROM = process.env.SMTP_FROM || "no-reply@darna.local";
export const EMAIL_DELIVERY_ENABLED = String(process.env.EMAIL_DELIVERY_ENABLED || "false").toLowerCase() === "true";
