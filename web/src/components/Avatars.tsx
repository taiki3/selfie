/* かわいいキャラアバター & 装飾パーツ (SVG自作) — design avatars.jsx の移植 */
import type { CSSProperties, ReactNode } from "react";

// パステル体色パレット (アバター用)
export const AV_COLORS = [
  { body: "#FFC2DC", deep: "#FF8FB8", cheek: "#FF8FB8" }, // pink
  { body: "#B6ECD8", deep: "#5FD4AE", cheek: "#FF9EC4" }, // mint
  { body: "#D6C5F5", deep: "#A685E2", cheek: "#FF9EC4" }, // lavender
  { body: "#BFE0FF", deep: "#6FB6F2", cheek: "#FF9EC4" }, // sky
  { body: "#FFE6A8", deep: "#FFC83D", cheek: "#FF9EC4" }, // butter
  { body: "#FFD0BD", deep: "#FF9E7A", cheek: "#FF7E9E" }, // peach
];

type Mouth = "smile" | "open" | "cat";

function Face({ mouth = "smile", cheek }: { mouth?: Mouth; cheek: string }) {
  return (
    <g>
      <ellipse cx="40" cy="56" rx="4.5" ry="6" fill="#5B4250" />
      <ellipse cx="60" cy="56" rx="4.5" ry="6" fill="#5B4250" />
      <circle cx="41.6" cy="53.5" r="1.6" fill="#fff" />
      <circle cx="61.6" cy="53.5" r="1.6" fill="#fff" />
      <circle cx="30" cy="64" r="6" fill={cheek} opacity="0.55" />
      <circle cx="70" cy="64" r="6" fill={cheek} opacity="0.55" />
      {mouth === "smile" && (
        <path d="M44 66 Q50 73 56 66" stroke="#5B4250" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}
      {mouth === "open" && (
        <path d="M43 65 Q50 76 57 65 Q50 70 43 65 Z" fill="#E86C8E" stroke="#5B4250" strokeWidth="2" strokeLinejoin="round" />
      )}
      {mouth === "cat" && (
        <path d="M44 66 Q47 70 50 66 Q53 70 56 66" stroke="#5B4250" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

export interface AvatarProps {
  id?: number;
  color?: number;
  className?: string;
  style?: CSSProperties;
}

// 8種類のキャラ。id でアクセサリ違い、color で体色違い。
export function Avatar({ id = 0, color = 0, className = "", style }: AvatarProps) {
  const c = AV_COLORS[((color % AV_COLORS.length) + AV_COLORS.length) % AV_COLORS.length];
  const variant = ((id % 8) + 8) % 8;

  const accessories: ReactNode[] = [
    // 0: リボン
    <g key="a0">
      <path d="M50 18 L34 8 Q30 18 50 22 Q70 18 66 8 Z" fill="#FF7EA8" />
      <circle cx="50" cy="18" r="5" fill="#FF5C8F" />
    </g>,
    // 1: ねこ耳
    <g key="a1">
      <path d="M28 22 L24 4 L42 16 Z" fill={c.body} stroke={c.deep} strokeWidth="2" strokeLinejoin="round" />
      <path d="M72 22 L76 4 L58 16 Z" fill={c.body} stroke={c.deep} strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 17 L28 8 L37 15 Z" fill="#FF9EC4" />
      <path d="M70 17 L72 8 L63 15 Z" fill="#FF9EC4" />
    </g>,
    // 2: アホ毛
    <g key="a2">
      <path d="M50 20 Q52 4 60 6 Q52 10 53 20 Z" fill={c.deep} />
    </g>,
    // 3: お花
    <g key="a3">
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <ellipse key={i} cx="30" cy="14" rx="5" ry="7" fill="#FFAFD0" transform={`rotate(${deg} 30 18)`} />
      ))}
      <circle cx="30" cy="18" r="4" fill="#FFC83D" />
    </g>,
    // 4: 王冠
    <g key="a4">
      <path d="M36 20 L36 8 L43 14 L50 6 L57 14 L64 8 L64 20 Z" fill="#FFD45E" stroke="#F2B600" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="50" cy="9" r="2" fill="#FF8FB8" />
    </g>,
    // 5: たれ耳 (うさぎ)
    <g key="a5">
      <path d="M40 22 Q30 0 38 2 Q46 8 46 22 Z" fill={c.body} stroke={c.deep} strokeWidth="2" strokeLinejoin="round" />
      <path d="M60 22 Q70 0 62 2 Q54 8 54 22 Z" fill={c.body} stroke={c.deep} strokeWidth="2" strokeLinejoin="round" />
    </g>,
    // 6: ヘアピン
    <g key="a6">
      <rect x="20" y="34" width="16" height="7" rx="3.5" fill="#7FD8FF" transform="rotate(-18 28 37)" />
      <rect x="22" y="42" width="11" height="5" rx="2.5" fill="#FFC83D" transform="rotate(-18 27 44)" />
    </g>,
    // 7: 双子テール
    <g key="a7">
      <circle cx="22" cy="44" r="11" fill={c.body} stroke={c.deep} strokeWidth="2.5" />
      <circle cx="78" cy="44" r="11" fill={c.body} stroke={c.deep} strokeWidth="2.5" />
    </g>,
  ];

  const mouths: Mouth[] = ["smile", "cat", "open", "smile", "smile", "cat", "open", "smile"];

  return (
    <svg className={className} style={style} viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      {accessories[variant]}
      <circle cx="50" cy="58" r="34" fill={c.body} stroke={c.deep} strokeWidth="2.5" />
      <path d="M18 50 Q22 26 50 26 Q78 26 82 50 Q70 40 50 41 Q30 40 18 50 Z" fill={c.deep} opacity="0.55" />
      <Face mouth={mouths[variant]} cheek={c.cheek} />
    </svg>
  );
}

export function Sparkle({ size = 20, color = "#FFC83D", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg className="sparkle" width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path d="M12 0 Q14 9 24 12 Q14 15 12 24 Q10 15 0 12 Q10 9 12 0 Z" fill={color} />
    </svg>
  );
}

export function HeartShape({ size = 18, color = "#FF6FA5", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path d="M12 21 C-6 9 6 -2 12 6 C18 -2 30 9 12 21 Z" fill={color} />
    </svg>
  );
}

export function StarShape({ size = 18, color = "#FFC83D", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      <path d="M12 1 L15 9 L23 9 L17 14 L19 22 L12 17 L5 22 L7 14 L1 9 L9 9 Z" fill={color} />
    </svg>
  );
}

// 写真(URL or dataURL) があれば写真、なければSVGキャラ
export function Portrait({
  photo, id = 0, color = 0, className = "", style,
}: { photo?: string | null; id?: number; color?: number; className?: string; style?: CSSProperties }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className={className}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
      />
    );
  }
  return <Avatar id={id} color={color} className={className} style={style} />;
}

// 散らしキラキラ (deco量に連動)
export function ConfettiField() {
  const items = [
    { C: HeartShape, x: "4%", y: "12%", s: 16, color: "#FFAFD0", rot: -12 },
    { C: StarShape, x: "92%", y: "8%", s: 20, color: "#FFD45E", rot: 14 },
    { C: Sparkle, x: "88%", y: "40%", s: 18, color: "#A685E2", rot: 0 },
    { C: HeartShape, x: "8%", y: "60%", s: 14, color: "#8FE3C8", rot: 20 },
    { C: StarShape, x: "50%", y: "4%", s: 14, color: "#9BD0FF", rot: -8 },
    { C: Sparkle, x: "2%", y: "38%", s: 14, color: "#FF9EC4", rot: 0 },
  ];
  return (
    <div className="sparkle" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      {items.map((it, i) => {
        const C = it.C;
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: it.x, top: it.y,
              transform: `rotate(${it.rot}deg)`,
              animation: `floaty ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            <C size={it.s} color={it.color} />
          </div>
        );
      })}
    </div>
  );
}
