import { randomUUID } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config.js";

export const CLIENT_COOKIE = "selfie_client";
export const ADMIN_COOKIE = "selfie_admin";

/**
 * Resolve a stable anonymous client id from a signed cookie, minting one on
 * first contact. Used to dedupe reactions per browser without real accounts.
 */
export function clientId(req: FastifyRequest, reply: FastifyReply): string {
  const existing = req.cookies[CLIENT_COOKIE];
  if (existing) {
    const unsigned = req.unsignCookie(existing);
    if (unsigned.valid && unsigned.value) return unsigned.value;
  }
  const id = randomUUID();
  reply.setCookie(CLIENT_COOKIE, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: config.secureCookies,
    signed: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

/** Constant-time password comparison so timing can't probe the admin password. */
export function checkAdminPassword(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(config.adminPassword);
  if (a.length !== b.length) {
    // Still compare against a fixed buffer to keep timing uniform.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Issue the signed admin-session cookie. */
export function grantAdmin(reply: FastifyReply): void {
  reply.setCookie(ADMIN_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: config.secureCookies,
    signed: true,
    maxAge: config.adminSessionTtl,
  });
}

export function revokeAdmin(reply: FastifyReply): void {
  reply.clearCookie(ADMIN_COOKIE, { path: "/" });
}

export function isAdmin(req: FastifyRequest): boolean {
  const raw = req.cookies[ADMIN_COOKIE];
  if (!raw) return false;
  const unsigned = req.unsignCookie(raw);
  return unsigned.valid && unsigned.value === "1";
}
