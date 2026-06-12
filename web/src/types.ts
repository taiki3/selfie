// Mirrors the API's serialised shapes (api/src/types.ts).

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
  /** URL to the photo (/api/sheets/:id/photo) or null for the character avatar. */
  photo: string | null;
  lunchDate: string;
  reactions: Reactions;
  comments: Comment[];
  myReactions: ReactionKey[];
}

/** The editable draft held by the create/edit form. */
export interface Draft {
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
  /** Local data URL while editing, or an existing photo URL, or null. */
  photo: string | null;
  /** Whether `photo` is a freshly picked data URL that must be uploaded. */
  photoDirty: boolean;
  pin: string;
}

export interface Dept {
  name: string;
  color: string;
  deep: string;
  soft: string;
}
