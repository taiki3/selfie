/* 写真 正方形クロップ — design screens.jsx の移植 */
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";

const FRAME = 280; // 画面上のクロップ枠サイズ
const OUT = 480; // 書き出す正方形サイズ

export function PhotoCropModal({
  src, onCancel, onDone,
}: { src: string; onCancel: () => void; onDone: (dataUrl: string) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const im = new Image();
    im.onload = () => { setImg(im); setScale(1); setOff({ x: 0, y: 0 }); };
    im.src = src;
  }, [src]);

  if (!img) {
    return (
      <div className="overlay" onClick={onCancel}>
        <div className="crop-box" onClick={(e) => e.stopPropagation()}>
          <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>よみこみ中…</p>
        </div>
      </div>
    );
  }

  const base = Math.max(FRAME / img.width, FRAME / img.height);
  const dispW = img.width * base * scale;
  const dispH = img.height * base * scale;

  const clamp = (o: { x: number; y: number }) => {
    const mx = Math.max(0, (dispW - FRAME) / 2);
    const my = Math.max(0, (dispH - FRAME) / 2);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };

  const point = (e: React.MouseEvent | React.TouchEvent) =>
    "touches" in e ? e.touches[0] : (e as React.MouseEvent);
  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    const p = point(e);
    drag.current = { px: p.clientX, py: p.clientY, ox: off.x, oy: off.y };
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drag.current) return;
    const p = point(e);
    setOff(clamp({ x: drag.current.ox + (p.clientX - drag.current.px), y: drag.current.oy + (p.clientY - drag.current.py) }));
  };
  const onUp = () => { drag.current = null; };

  const confirm = () => {
    const k = OUT / FRAME;
    const c = document.createElement("canvas");
    c.width = OUT; c.height = OUT;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, OUT, OUT);
    const left = FRAME / 2 + off.x - dispW / 2;
    const top = FRAME / 2 + off.y - dispH / 2;
    ctx.drawImage(img, left * k, top * k, dispW * k, dispH * k);
    onDone(c.toDataURL("image/jpeg", 0.85));
  };

  const imgLeft = FRAME / 2 + off.x - dispW / 2;
  const imgTop = FRAME / 2 + off.y - dispH / 2;

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="crop-box" onClick={(e) => e.stopPropagation()}>
        <h4 className="crop-title">写真を四角く切り抜く</h4>
        <p className="crop-help">ドラッグで位置調整・スライダーで大きさ調整できるよ</p>
        <div
          className="crop-frame"
          style={{ width: FRAME, height: FRAME }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        >
          <img
            src={src} draggable={false} alt=""
            style={{ position: "absolute", left: imgLeft, top: imgTop, width: dispW, height: dispH, userSelect: "none", pointerEvents: "none" }}
          />
          <div className="crop-grid" />
        </div>
        <div className="crop-zoom">
          <Icon name="image" size={16} />
          <input
            type="range" min="1" max="3" step="0.01" value={scale}
            onChange={(e) => { const s = parseFloat(e.target.value); setScale(s); setOff((o) => clamp(o)); }}
          />
          <Icon name="image" size={22} />
        </div>
        <div className="crop-actions">
          <button className="btn ghost" onClick={onCancel}>やめる</button>
          <button className="btn" onClick={confirm}><Icon name="check" size={18} /> これにする</button>
        </div>
      </div>
    </div>
  );
}
