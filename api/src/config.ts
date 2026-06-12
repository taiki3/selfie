// Centralised, validated environment configuration.

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",

  // Postgres. The EKS team injects DATABASE_URL via the selfie-secrets Secret.
  databaseUrl: required("DATABASE_URL", "postgres://selfie:selfie@localhost:5432/selfie"),

  // Admin login password. The prototype used "lunch2026"; production overrides
  // this via the Secret. Auth is verified server-side (the design requires it).
  adminPassword: process.env.ADMIN_PASSWORD ?? "lunch2026",

  // Secret used to sign the admin session cookie. MUST be overridden in prod.
  sessionSecret: process.env.SESSION_SECRET ?? "dev-insecure-session-secret-change-me",

  // Set cookies with the Secure flag (requires HTTPS). True behind the ALB.
  secureCookies: (process.env.SECURE_COOKIES ?? "false").toLowerCase() === "true",

  // CORS allow-list. In production the web origin is same-host via nginx, so
  // this is mostly for completeness / non-proxied setups.
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // How long an admin session lasts (seconds).
  adminSessionTtl: Number(process.env.ADMIN_SESSION_TTL ?? 60 * 60 * 8),

  // Max accepted photo data-URL size in bytes (~1.3x the decoded image).
  maxPhotoBytes: Number(process.env.MAX_PHOTO_BYTES ?? 3 * 1024 * 1024),
};

export type AppConfig = typeof config;
