import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import {
  type Comment,
  type Reactions,
  type ReactionKey,
  REACTION_KEYS,
  type Sheet,
  type SheetInput,
} from "./types.js";

interface SheetRow {
  id: string;
  nickname: string;
  fullname: string;
  avatar: number;
  av_color: number;
  dept_idx: number;
  catch: string;
  hobbies: string[];
  recent: string;
  resolution: string;
  wishlist: string;
  photo: string | null;
  lunch_date: Date | null;
  pin_hash: string;
}

const PIN_RE = /^\d{4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BCRYPT_COST = 10;

function zeroReactions(): Reactions {
  return { heart: 0, star: 0, clap: 0, smile: 0 };
}

/** Postgres DATE comes back as a Date; format as a stable yyyy-mm-dd string. */
function isoDate(d: Date | null): string {
  if (!d) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rowToSheet(
  row: SheetRow,
  reactions: Reactions,
  mine: ReactionKey[],
  comments: Comment[],
): Sheet {
  return {
    id: row.id,
    nickname: row.nickname,
    fullname: row.fullname,
    avatar: row.avatar,
    avColor: row.av_color,
    deptIdx: row.dept_idx,
    catch: row.catch,
    hobbies: Array.isArray(row.hobbies) ? row.hobbies : [],
    recent: row.recent,
    resolution: row.resolution,
    wishlist: row.wishlist,
    photo: row.photo ? `/api/sheets/${row.id}/photo` : null,
    lunchDate: isoDate(row.lunch_date),
    reactions,
    comments,
    myReactions: mine,
  };
}

const SHEET_COLS =
  "id, nickname, fullname, avatar, av_color, dept_idx, catch, hobbies, recent, resolution, wishlist, photo, lunch_date, pin_hash";

/** Validate + normalise a 4-digit PIN, throwing a 400-able error otherwise. */
function assertPin(pin: unknown): string {
  if (typeof pin !== "string" || !PIN_RE.test(pin)) {
    const e = new Error("PINは4桁の数字で入力してください");
    (e as { statusCode?: number }).statusCode = 400;
    throw e;
  }
  return pin;
}

export async function listSheets(clientId: string): Promise<Sheet[]> {
  const [sheetsRes, reactRes, mineRes, commentsRes] = await Promise.all([
    pool.query<SheetRow>(`SELECT ${SHEET_COLS} FROM sheets ORDER BY created_at DESC`),
    pool.query<{ sheet_id: string; kind: ReactionKey; n: string }>(
      "SELECT sheet_id, kind, COUNT(*)::text AS n FROM reactions GROUP BY sheet_id, kind",
    ),
    pool.query<{ sheet_id: string; kind: ReactionKey }>(
      "SELECT sheet_id, kind FROM reactions WHERE client_id = $1",
      [clientId],
    ),
    pool.query<{ sheet_id: string; by: string; avatar: number; av_color: number; text: string }>(
      "SELECT sheet_id, by, avatar, av_color, text FROM comments ORDER BY created_at",
    ),
  ]);

  const reactById = new Map<string, Reactions>();
  for (const r of reactRes.rows) {
    const cur = reactById.get(r.sheet_id) ?? zeroReactions();
    cur[r.kind] = Number(r.n);
    reactById.set(r.sheet_id, cur);
  }
  const mineById = new Map<string, ReactionKey[]>();
  for (const r of mineRes.rows) {
    const arr = mineById.get(r.sheet_id) ?? [];
    arr.push(r.kind);
    mineById.set(r.sheet_id, arr);
  }
  const commentsById = new Map<string, Comment[]>();
  for (const c of commentsRes.rows) {
    const arr = commentsById.get(c.sheet_id) ?? [];
    arr.push({ by: c.by, avatar: c.avatar, avColor: c.av_color, text: c.text });
    commentsById.set(c.sheet_id, arr);
  }

  return sheetsRes.rows.map((row) =>
    rowToSheet(
      row,
      reactById.get(row.id) ?? zeroReactions(),
      mineById.get(row.id) ?? [],
      commentsById.get(row.id) ?? [],
    ),
  );
}

export async function getSheet(id: string, clientId: string): Promise<Sheet | null> {
  const sheetRes = await pool.query<SheetRow>(
    `SELECT ${SHEET_COLS} FROM sheets WHERE id = $1`,
    [id],
  );
  const row = sheetRes.rows[0];
  if (!row) return null;

  const [reactRes, mineRes, commentsRes] = await Promise.all([
    pool.query<{ kind: ReactionKey; n: string }>(
      "SELECT kind, COUNT(*)::text AS n FROM reactions WHERE sheet_id = $1 GROUP BY kind",
      [id],
    ),
    pool.query<{ kind: ReactionKey }>(
      "SELECT kind FROM reactions WHERE sheet_id = $1 AND client_id = $2",
      [id, clientId],
    ),
    pool.query<{ by: string; avatar: number; av_color: number; text: string }>(
      "SELECT by, avatar, av_color, text FROM comments WHERE sheet_id = $1 ORDER BY created_at",
      [id],
    ),
  ]);

  const reactions = zeroReactions();
  for (const r of reactRes.rows) reactions[r.kind] = Number(r.n);
  const mine = mineRes.rows.map((r) => r.kind);
  const comments = commentsRes.rows.map((c) => ({
    by: c.by,
    avatar: c.avatar,
    avColor: c.av_color,
    text: c.text,
  }));

  return rowToSheet(row, reactions, mine, comments);
}

export async function createSheet(input: SheetInput, clientId: string): Promise<Sheet> {
  const pin = assertPin(input.pin);
  const id = `s-${randomUUID()}`;
  const pinHash = await bcrypt.hash(pin, BCRYPT_COST);
  const photo = typeof input.photo === "string" ? input.photo : null;

  await pool.query(
    `INSERT INTO sheets
       (id, nickname, fullname, avatar, av_color, dept_idx, catch, hobbies, recent, resolution, wishlist, photo, pin_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13)`,
    [
      id,
      input.nickname,
      input.fullname,
      input.avatar,
      input.avColor,
      input.deptIdx,
      input.catch,
      JSON.stringify(input.hobbies ?? []),
      input.recent,
      input.resolution,
      input.wishlist,
      photo,
      pinHash,
    ],
  );

  const sheet = await getSheet(id, clientId);
  if (!sheet) throw new Error("created sheet vanished");
  return sheet;
}

/** True when `pin` matches the stored hash. Returns false for unknown sheets. */
export async function verifyPin(id: string, pin: string): Promise<boolean> {
  const res = await pool.query<{ pin_hash: string }>("SELECT pin_hash FROM sheets WHERE id = $1", [id]);
  const row = res.rows[0];
  if (!row) return false;
  return bcrypt.compare(pin, row.pin_hash);
}

/**
 * Edit a sheet after verifying its PIN. Optionally rotates the PIN (newPin).
 * Returns null when the sheet is missing or the PIN is wrong.
 */
export async function updateSheet(
  id: string,
  input: SheetInput,
  clientId: string,
): Promise<Sheet | null> {
  assertPin(input.pin);
  if (!(await verifyPin(id, input.pin))) return null;

  let pinHashClause = "";
  const params: unknown[] = [
    input.nickname,
    input.fullname,
    input.avatar,
    input.avColor,
    input.deptIdx,
    input.catch,
    JSON.stringify(input.hobbies ?? []),
    input.recent,
    input.resolution,
    input.wishlist,
  ];

  // photo: undefined = keep, null = clear, string = replace.
  let photoClause = "";
  if (input.photo !== undefined) {
    params.push(input.photo);
    photoClause = `, photo = $${params.length}`;
  }

  if (input.newPin !== undefined && input.newPin !== "") {
    const newPin = assertPin(input.newPin);
    const newHash = await bcrypt.hash(newPin, BCRYPT_COST);
    params.push(newHash);
    pinHashClause = `, pin_hash = $${params.length}`;
  }

  params.push(id);
  const idIdx = params.length;

  const res = await pool.query(
    `UPDATE sheets SET
       nickname = $1, fullname = $2, avatar = $3, av_color = $4, dept_idx = $5,
       catch = $6, hobbies = $7::jsonb, recent = $8, resolution = $9, wishlist = $10,
       updated_at = now()${photoClause}${pinHashClause}
     WHERE id = $${idIdx}`,
    params,
  );
  if (res.rowCount === 0) return null;
  return getSheet(id, clientId);
}

/** Toggle one reaction for an anonymous client; returns fresh counts + my keys. */
export async function toggleReaction(
  id: string,
  clientId: string,
  kind: ReactionKey,
): Promise<{ reactions: Reactions; myReactions: ReactionKey[] } | null> {
  const exists = await pool.query("SELECT 1 FROM sheets WHERE id = $1", [id]);
  if (exists.rowCount === 0) return null;

  const had = await pool.query(
    "SELECT 1 FROM reactions WHERE sheet_id = $1 AND client_id = $2 AND kind = $3",
    [id, clientId, kind],
  );
  if (had.rowCount && had.rowCount > 0) {
    await pool.query(
      "DELETE FROM reactions WHERE sheet_id = $1 AND client_id = $2 AND kind = $3",
      [id, clientId, kind],
    );
  } else {
    await pool.query(
      "INSERT INTO reactions (sheet_id, client_id, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [id, clientId, kind],
    );
  }

  const [countsRes, mineRes] = await Promise.all([
    pool.query<{ kind: ReactionKey; n: string }>(
      "SELECT kind, COUNT(*)::text AS n FROM reactions WHERE sheet_id = $1 GROUP BY kind",
      [id],
    ),
    pool.query<{ kind: ReactionKey }>(
      "SELECT kind FROM reactions WHERE sheet_id = $1 AND client_id = $2",
      [id, clientId],
    ),
  ]);
  const reactions = zeroReactions();
  for (const r of countsRes.rows) reactions[r.kind] = Number(r.n);
  return { reactions, myReactions: mineRes.rows.map((r) => r.kind) };
}

export async function addComment(
  id: string,
  comment: Comment,
): Promise<Comment | null> {
  const exists = await pool.query("SELECT 1 FROM sheets WHERE id = $1", [id]);
  if (exists.rowCount === 0) return null;
  await pool.query(
    "INSERT INTO comments (sheet_id, by, avatar, av_color, text) VALUES ($1, $2, $3, $4, $5)",
    [id, comment.by, comment.avatar, comment.avColor, comment.text],
  );
  return comment;
}

/** Admin-only: set or clear a sheet's lunch date. */
export async function setLunchDate(id: string, date: string): Promise<boolean> {
  if (date !== "" && !DATE_RE.test(date)) {
    const e = new Error("日付の形式が不正です");
    (e as { statusCode?: number }).statusCode = 400;
    throw e;
  }
  const res = await pool.query("UPDATE sheets SET lunch_date = $1, updated_at = now() WHERE id = $2", [
    date === "" ? null : date,
    id,
  ]);
  return (res.rowCount ?? 0) > 0;
}

export interface StoredPhoto {
  mime: string;
  body: Buffer;
}

/** Decode the stored data URL into bytes for the photo endpoint. */
export async function getPhoto(id: string): Promise<StoredPhoto | null> {
  const res = await pool.query<{ photo: string | null }>("SELECT photo FROM sheets WHERE id = $1", [id]);
  const photo = res.rows[0]?.photo;
  if (!photo) return null;
  const m = /^data:([^;]+);base64,(.+)$/s.exec(photo);
  if (!m) return null;
  return { mime: m[1], body: Buffer.from(m[2], "base64") };
}

export { REACTION_KEYS };
