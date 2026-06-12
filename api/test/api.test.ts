import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const HAS_DB = !!process.env.DATABASE_URL;

// ── DB-free unit checks (always run) ──
describe("admin password check", () => {
  it("accepts the configured password and rejects others", async () => {
    const { checkAdminPassword } = await import("../src/auth.js");
    expect(checkAdminPassword("lunch2026")).toBe(true);
    expect(checkAdminPassword("wrong")).toBe(false);
    expect(checkAdminPassword("")).toBe(false);
  });
});

// ── Integration (requires a Postgres reachable via DATABASE_URL) ──
describe.skipIf(!HAS_DB)("sheets API (integration)", () => {
  let app: FastifyInstance;
  let cookie = "";

  beforeAll(async () => {
    const { migrate } = await import("../src/db.js");
    await migrate();
    const { buildApp } = await import("../src/app.js");
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    const { close } = await import("../src/db.js");
    await close();
  });

  // Capture the client cookie minted by the first request so reactions dedupe.
  function withCookie(headers: Record<string, string> = {}): Record<string, string> {
    return cookie ? { ...headers, cookie } : headers;
  }
  function rememberCookie(res: { headers: Record<string, unknown> }): void {
    const set = res.headers["set-cookie"];
    const arr = Array.isArray(set) ? set : set ? [String(set)] : [];
    for (const c of arr) {
      const m = /^(selfie_client=[^;]+)/.exec(c);
      if (m) cookie = cookie ? `${cookie}; ${m[1]}` : m[1];
    }
  }

  it("health + ready", async () => {
    expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
    const ready = await app.inject({ method: "GET", url: "/ready" });
    expect(ready.statusCode).toBe(200);
  });

  let createdId = "";
  it("creates, lists, edits with PIN, and rejects a wrong PIN", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/api/sheets",
      payload: {
        nickname: "てすと", fullname: "試験 太郎", avatar: 1, avColor: 2, deptIdx: 1,
        catch: "テスト用プロフ", hobbies: ["テスト"], recent: "", resolution: "", wishlist: "",
        pin: "4242",
      },
    });
    expect(create.statusCode).toBe(201);
    rememberCookie(create);
    const sheet = create.json();
    createdId = sheet.id;
    expect(sheet.nickname).toBe("てすと");
    expect(sheet.pin).toBeUndefined(); // PIN must never be serialised
    expect(sheet.reactions).toEqual({ heart: 0, star: 0, clap: 0, smile: 0 });

    const list = await app.inject({ method: "GET", url: "/api/sheets", headers: withCookie() });
    expect(list.statusCode).toBe(200);
    expect(list.json().some((s: { id: string }) => s.id === createdId)).toBe(true);

    const wrong = await app.inject({ method: "POST", url: `/api/sheets/${createdId}/verify-pin`, payload: { pin: "0000" } });
    expect(wrong.json().ok).toBe(false);
    const right = await app.inject({ method: "POST", url: `/api/sheets/${createdId}/verify-pin`, payload: { pin: "4242" } });
    expect(right.json().ok).toBe(true);

    const badEdit = await app.inject({ method: "PUT", url: `/api/sheets/${createdId}`, payload: { nickname: "x", catch: "y", pin: "0000", hobbies: [] } });
    expect(badEdit.statusCode).toBe(403);

    const edit = await app.inject({
      method: "PUT", url: `/api/sheets/${createdId}`,
      payload: { nickname: "てすと2", catch: "へんしゅう済み", pin: "4242", newPin: "9999", hobbies: ["a", "b"] },
    });
    expect(edit.statusCode).toBe(200);
    expect(edit.json().nickname).toBe("てすと2");

    // After rotation the old PIN fails and the new one works.
    expect((await app.inject({ method: "POST", url: `/api/sheets/${createdId}/verify-pin`, payload: { pin: "4242" } })).json().ok).toBe(false);
    expect((await app.inject({ method: "POST", url: `/api/sheets/${createdId}/verify-pin`, payload: { pin: "9999" } })).json().ok).toBe(true);
  });

  it("toggles a reaction and dedupes per client", async () => {
    const on = await app.inject({ method: "POST", url: `/api/sheets/${createdId}/reactions`, payload: { kind: "heart" }, headers: withCookie() });
    rememberCookie(on);
    expect(on.json().reactions.heart).toBe(1);
    expect(on.json().myReactions).toContain("heart");
    const off = await app.inject({ method: "POST", url: `/api/sheets/${createdId}/reactions`, payload: { kind: "heart" }, headers: withCookie() });
    expect(off.json().reactions.heart).toBe(0);
  });

  it("adds a comment", async () => {
    const res = await app.inject({ method: "POST", url: `/api/sheets/${createdId}/comments`, payload: { text: "こんにちは", by: "ゲスト" }, headers: withCookie() });
    expect(res.statusCode).toBe(201);
    const detail = await app.inject({ method: "GET", url: `/api/sheets/${createdId}`, headers: withCookie() });
    expect(detail.json().comments.at(-1).text).toBe("こんにちは");
  });

  it("blocks lunch-date for non-admins and allows it after login", async () => {
    const denied = await app.inject({ method: "PUT", url: `/api/sheets/${createdId}/lunch-date`, payload: { date: "2026-07-01" }, headers: withCookie() });
    expect(denied.statusCode).toBe(403);

    const login = await app.inject({ method: "POST", url: "/api/admin/login", payload: { password: "lunch2026" } });
    expect(login.statusCode).toBe(200);
    const adminCookie = String((login.headers["set-cookie"] as string[] | string) ?? "");
    const adminVal = (Array.isArray(adminCookie) ? adminCookie.join(";") : adminCookie).match(/selfie_admin=[^;]+/)?.[0] ?? "";

    const ok = await app.inject({
      method: "PUT", url: `/api/sheets/${createdId}/lunch-date`,
      payload: { date: "2026-07-01" },
      headers: { cookie: `${cookie}; ${adminVal}` },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().lunchDate).toBe("2026-07-01");
  });
});
