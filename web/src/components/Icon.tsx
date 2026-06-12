/* シンプルな丸ゴシック感のあるアイコン — design components.jsx の移植 */
import type { CSSProperties } from "react";

export type IconName =
  | "home" | "users" | "plus" | "user" | "x" | "edit" | "send"
  | "check" | "share" | "back" | "sparkle" | "camera" | "trash"
  | "image" | "calendar" | "gear";

export function Icon({ name, size = 24, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, style,
  };
  switch (name) {
    case "home": return <svg {...p}><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></svg>;
    case "users": return <svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><path d="M16 6.2a3 3 0 0 1 0 5.6" /><path d="M17 14c2.3.4 4 2.3 4 5" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "user": return <svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" /></svg>;
    case "x": return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "edit": return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>;
    case "send": return <svg {...p}><path d="M4 12l16-7-7 16-2-7-7-2z" /></svg>;
    case "check": return <svg {...p}><path d="M5 12l5 5L20 6" /></svg>;
    case "share": return <svg {...p}><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8 11l8-4M8 13l8 4" /></svg>;
    case "back": return <svg {...p}><path d="M15 5l-7 7 7 7" /></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>;
    case "camera": return <svg {...p}><path d="M3 8h3l1.5-2.2h9L18 8h3v11H3z" /><circle cx="12" cy="13" r="3.4" /></svg>;
    case "trash": return <svg {...p}><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" /></svg>;
    case "image": return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M5 18l5-5 4 4 3-2 4 3" /></svg>;
    case "calendar": return <svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /><circle cx="8.5" cy="14" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none" /></svg>;
    case "gear": return <svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></svg>;
    default: return null;
  }
}
