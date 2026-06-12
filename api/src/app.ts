import cookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import { config } from "./config.js";
import { ping } from "./db.js";
import { checkAdminPassword, clientId, grantAdmin, isAdmin, revokeAdmin } from "./auth.js";
import {
  addComment,
  createSheet,
  getPhoto,
  getSheet,
  listSheets,
  setLunchDate,
  toggleReaction,
  updateSheet,
  verifyPin,
} from "./sheets.js";
import { REACTION_KEYS, type ReactionKey, type SheetInput } from "./types.js";

function badRequest(message: string): never {
  const e = new Error(message);
  (e as { statusCode?: number }).statusCode = 400;
  throw e;
}

/** Coerce + validate the create/edit payload, rejecting junk early. */
function parseSheetInput(body: unknown): SheetInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number): string =>
    typeof v === "string" ? v.slice(0, max) : "";
  const idx = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  };
  const nickname = str(b.nickname, 12).trim();
  if (!nickname) badRequest("ニックネームは必須です");
  const cat = str(b.catch, 30).trim();
  if (!cat) badRequest("キャッチコピーは必須です");

  const hobbies = Array.isArray(b.hobbies)
    ? b.hobbies.filter((h): h is string => typeof h === "string").slice(0, 6).map((h) => h.slice(0, 12))
    : [];

  const input: SheetInput = {
    nickname,
    fullname: str(b.fullname, 20),
    avatar: idx(b.avatar),
    avColor: idx(b.avColor),
    deptIdx: idx(b.deptIdx),
    catch: cat,
    hobbies,
    recent: str(b.recent, 100),
    resolution: str(b.resolution, 40),
    wishlist: str(b.wishlist, 40),
    pin: typeof b.pin === "string" ? b.pin : "",
  };
  if (b.photo === null) input.photo = null;
  else if (typeof b.photo === "string" && b.photo.startsWith("data:")) {
    if (b.photo.length > config.maxPhotoBytes) badRequest("写真のサイズが大きすぎます");
    input.photo = b.photo;
  }
  if (typeof b.newPin === "string" && b.newPin !== "") input.newPin = b.newPin;
  return input;
}

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    bodyLimit: config.maxPhotoBytes + 1024 * 1024,
    trustProxy: true,
  });

  app.register(cookie, { secret: config.sessionSecret });

  // Minimal CORS for non-proxied / cross-origin dev setups. Same-origin
  // (nginx /api proxy) needs none, but credentials must be allowed when used.
  app.addHook("onRequest", async (req, reply) => {
    const origin = req.headers.origin;
    if (origin && config.allowedOrigins.includes(origin)) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
      reply.header("Vary", "Origin");
      if (req.method === "OPTIONS") {
        reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        reply.header("Access-Control-Allow-Headers", "content-type");
        reply.code(204).send();
      }
    }
  });

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err.statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    reply.code(status).send({ error: err.message || "internal error" });
  });

  // ── Health / readiness probes (consumed by the k8s deployment) ──
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async (_req, reply) => {
    try {
      await ping();
      return { status: "ready" };
    } catch {
      reply.code(503);
      return { status: "not-ready" };
    }
  });

  // ── Sheets ──
  app.get("/api/sheets", async (req, reply) => {
    const cid = clientId(req, reply);
    return listSheets(cid);
  });

  app.get<{ Params: { id: string } }>("/api/sheets/:id", async (req, reply) => {
    const cid = clientId(req, reply);
    const sheet = await getSheet(req.params.id, cid);
    if (!sheet) return reply.code(404).send({ error: "見つかりませんでした" });
    return sheet;
  });

  app.post("/api/sheets", async (req, reply) => {
    const cid = clientId(req, reply);
    const input = parseSheetInput(req.body);
    const sheet = await createSheet(input, cid);
    reply.code(201);
    return sheet;
  });

  app.put<{ Params: { id: string } }>("/api/sheets/:id", async (req, reply) => {
    const cid = clientId(req, reply);
    const input = parseSheetInput(req.body);
    const sheet = await updateSheet(req.params.id, input, cid);
    if (!sheet) return reply.code(403).send({ error: "PINが正しくありません" });
    return sheet;
  });

  // Pre-flight PIN check used by the edit gate before opening the editor.
  app.post<{ Params: { id: string }; Body: { pin?: string } }>(
    "/api/sheets/:id/verify-pin",
    async (req) => {
      const pin = typeof req.body?.pin === "string" ? req.body.pin : "";
      return { ok: await verifyPin(req.params.id, pin) };
    },
  );

  app.get<{ Params: { id: string } }>("/api/sheets/:id/photo", async (req, reply) => {
    const photo = await getPhoto(req.params.id);
    if (!photo) return reply.code(404).send({ error: "写真がありません" });
    reply.header("Content-Type", photo.mime);
    reply.header("Cache-Control", "no-cache");
    return reply.send(photo.body);
  });

  // ── Reactions (toggle, deduped per anonymous client) ──
  app.post<{ Params: { id: string }; Body: { kind?: string } }>(
    "/api/sheets/:id/reactions",
    async (req, reply) => {
      const cid = clientId(req, reply);
      const kind = req.body?.kind;
      if (!kind || !REACTION_KEYS.includes(kind as ReactionKey)) {
        return reply.code(400).send({ error: "不正なリアクションです" });
      }
      const result = await toggleReaction(req.params.id, cid, kind as ReactionKey);
      if (!result) return reply.code(404).send({ error: "見つかりませんでした" });
      return result;
    },
  );

  // ── Comments ──
  app.post<{
    Params: { id: string };
    Body: { text?: string; by?: string; avatar?: number; avColor?: number };
  }>("/api/sheets/:id/comments", async (req, reply) => {
    clientId(req, reply);
    const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 60) : "";
    if (!text) return reply.code(400).send({ error: "コメントを入力してください" });
    const comment = {
      by: (typeof req.body?.by === "string" && req.body.by.trim()) || "ゲスト",
      avatar: Number.isFinite(Number(req.body?.avatar)) ? Number(req.body?.avatar) : 4,
      avColor: Number.isFinite(Number(req.body?.avColor)) ? Number(req.body?.avColor) : 4,
      text,
    };
    const saved = await addComment(req.params.id, comment);
    if (!saved) return reply.code(404).send({ error: "見つかりませんでした" });
    reply.code(201);
    return saved;
  });

  // ── Admin (lunch-date scheduling) ──
  app.get("/api/admin/status", async (req) => ({ admin: isAdmin(req) }));

  app.post<{ Body: { password?: string } }>("/api/admin/login", async (req, reply) => {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!checkAdminPassword(password)) {
      return reply.code(401).send({ error: "パスワードがちがうみたい…" });
    }
    grantAdmin(reply);
    return { admin: true };
  });

  app.post("/api/admin/logout", async (_req, reply) => {
    revokeAdmin(reply);
    reply.code(204);
    return null;
  });

  app.put<{ Params: { id: string }; Body: { date?: string } }>(
    "/api/sheets/:id/lunch-date",
    async (req, reply) => {
      if (!isAdmin(req)) return reply.code(403).send({ error: "管理者のみが日程を入力できます" });
      const date = typeof req.body?.date === "string" ? req.body.date : "";
      const ok = await setLunchDate(req.params.id, date);
      if (!ok) return reply.code(404).send({ error: "見つかりませんでした" });
      const cid = clientId(req, reply);
      return getSheet(req.params.id, cid);
    },
  );

  return app;
}
