import type { Dept, Draft, ReactionKey } from "./types";

// dept: 部署。color/deep/soft はカードのテーマ色。
export const DEPTS: Dept[] = [
  { name: "デザイン部", color: "#FF9EC4", deep: "#FF6FA5", soft: "#FFE4EF" },
  { name: "えいぎょう部", color: "#8FE3C8", deep: "#38C9A0", soft: "#DEF7EE" },
  { name: "かいはつ部", color: "#9BD0FF", deep: "#5FB0F5", soft: "#E3F1FF" },
  { name: "じんじ部", color: "#C6B0EC", deep: "#A685E2", soft: "#EFE8FB" },
  { name: "マーケ部", color: "#FFE08A", deep: "#FFC83D", soft: "#FFF4D6" },
];

export type StyleKey = "pop" | "teen" | "min";
export type RoundKey = "pop" | "round" | "hand";
export type DecoKey = "off" | "normal" | "lots";

export interface Settings {
  style: StyleKey;
  theme: [string, string, string];
  round: RoundKey;
  deco: DecoKey;
}

export const DEFAULT_SETTINGS: Settings = {
  style: "pop",
  theme: ["#FF9EC4", "#FF6FA5", "#FFE4EF"],
  round: "pop",
  deco: "normal",
};

// デザインプリセット → 既定テーマ/装飾/フォント
export const STYLE_PRESETS: Record<StyleKey, Pick<Settings, "theme" | "deco" | "round">> = {
  pop: { theme: ["#FF9EC4", "#FF6FA5", "#FFE4EF"], deco: "normal", round: "pop" },
  teen: { theme: ["#54CBB6", "#2BAE97", "#E2F6F1"], deco: "off", round: "round" },
  min: { theme: ["#4C9BE0", "#2F7FC9", "#EAF3FB"], deco: "off", round: "round" },
};

export const THEME_OPTIONS: [string, string, string][] = [
  ["#FF9EC4", "#FF6FA5", "#FFE4EF"],
  ["#8FE3C8", "#38C9A0", "#DEF7EE"],
  ["#C6B0EC", "#A685E2", "#EFE8FB"],
  ["#9BD0FF", "#5FB0F5", "#E3F1FF"],
  ["#FFE08A", "#FFC83D", "#FFF4D6"],
  ["#54CBB6", "#2BAE97", "#E2F6F1"],
  ["#4C9BE0", "#2F7FC9", "#EAF3FB"],
];

export const THEME_NAMES: Record<string, string> = {
  "#FF9EC4": "ピンク", "#8FE3C8": "ミント", "#C6B0EC": "ラベンダー",
  "#9BD0FF": "スカイ", "#FFE08A": "バター", "#54CBB6": "ティール", "#4C9BE0": "ブルー",
};

export const STYLE_NAMES: Record<StyleKey, string> = {
  pop: "ポップ", teen: "ニュートラル", min: "ミニマル",
};

export const REACTIONS: { key: ReactionKey; emo: string; label: string }[] = [
  { key: "heart", emo: "💕", label: "すき" },
  { key: "star", emo: "⭐", label: "きらり" },
  { key: "clap", emo: "👏", label: "ぱちぱち" },
  { key: "smile", emo: "😊", label: "にこ" },
];

export const FONT_STACKS: Record<RoundKey, string> = {
  pop: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif',
  round: '"Zen Maru Gothic", sans-serif',
  hand: '"Yusei Magic", "Zen Maru Gothic", sans-serif',
};

export function emptyDraft(): Draft {
  return {
    nickname: "", fullname: "", avatar: 0, avColor: 0, deptIdx: 0, catch: "",
    hobbies: [], recent: "", resolution: "", wishlist: "",
    photo: null, photoDirty: false, pin: "",
  };
}
