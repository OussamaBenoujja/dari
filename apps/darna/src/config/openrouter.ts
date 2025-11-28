export const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/sherlock-dash-alpha";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || process.env.HTTP_REFERER || "";
export const OPENROUTER_SITE_TITLE = process.env.OPENROUTER_SITE_TITLE || process.env.X_TITLE || "";
