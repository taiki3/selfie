import type { Comment, Reactions, ReactionKey, Sheet } from "./types";

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `エラーが発生しました (${res.status})`;
    throw new ApiError(message);
  }
  return data as T;
}

/** Fields sent when creating or editing a sheet. */
export interface SheetPayload {
  nickname: string;
  fullname: string;
  avatar: number;
  avColor: number;
  deptIdx: number;
  catch: string;
  hobbies: string[];
  recent: string;
  resolution: string;
  wishlist: string;
  pin: string;
  newPin?: string;
  photo?: string | null;
}

export const api = {
  listSheets: () => request<Sheet[]>("/api/sheets"),

  getSheet: (id: string) => request<Sheet>(`/api/sheets/${id}`),

  createSheet: (payload: SheetPayload) =>
    request<Sheet>("/api/sheets", { method: "POST", body: JSON.stringify(payload) }),

  updateSheet: (id: string, payload: SheetPayload) =>
    request<Sheet>(`/api/sheets/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  verifyPin: (id: string, pin: string) =>
    request<{ ok: boolean }>(`/api/sheets/${id}/verify-pin`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    }).then((r) => r.ok),

  toggleReaction: (id: string, kind: ReactionKey) =>
    request<{ reactions: Reactions; myReactions: ReactionKey[] }>(
      `/api/sheets/${id}/reactions`,
      { method: "POST", body: JSON.stringify({ kind }) },
    ),

  addComment: (id: string, comment: Comment) =>
    request<Comment>(`/api/sheets/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(comment),
    }),

  adminStatus: () => request<{ admin: boolean }>("/api/admin/status").then((r) => r.admin),

  adminLogin: (password: string) =>
    request<{ admin: boolean }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }).then((r) => r.admin),

  adminLogout: () => request<void>("/api/admin/logout", { method: "POST" }),

  setLunchDate: (id: string, date: string) =>
    request<Sheet>(`/api/sheets/${id}/lunch-date`, {
      method: "PUT",
      body: JSON.stringify({ date }),
    }),
};
