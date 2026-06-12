// Shared API/domain types for the プロフ帳 (selfie) backend.

export interface Comment {
  by: string;
  avatar: number;
  avColor: number;
  text: string;
}

export interface Reactions {
  heart: number;
  star: number;
  clap: number;
  smile: number;
}

export type ReactionKey = keyof Reactions;

export const REACTION_KEYS: ReactionKey[] = ["heart", "star", "clap", "smile"];

/** A profile sheet as returned to the client. `pin` is never serialised. */
export interface Sheet {
  id: string;
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
  /** URL to the uploaded photo, or null when the character avatar is used. */
  photo: string | null;
  lunchDate: string; // ISO yyyy-mm-dd or "" when unset
  reactions: Reactions;
  comments: Comment[];
  /** Reaction keys the calling client has toggled on (per anonymous client id). */
  myReactions: ReactionKey[];
}

/** Fields accepted when creating or editing a sheet. */
export interface SheetInput {
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
  /** A data URL (image/*) for a freshly cropped photo, null to clear, undefined to keep. */
  photo?: string | null;
  /** 4-digit PIN. Required on create; on edit it is the auth check + optional change. */
  pin: string;
  /** When editing, the new PIN to set (optional). */
  newPin?: string;
}
