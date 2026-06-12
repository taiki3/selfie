/* ランチ会カレンダー — design screens.jsx の移植 */
import { useState } from "react";
import { Icon } from "../components/Icon";
import type { Sheet } from "../types";

export function LunchCalendar({
  sheets, selected, onSelect, onClose,
}: {
  sheets: Sheet[];
  selected: string | null;
  onSelect: (iso: string | null) => void;
  onClose: () => void;
}) {
  const counts: Record<string, number> = {};
  sheets.forEach((s) => { if (s.lunchDate) counts[s.lunchDate] = (counts[s.lunchDate] || 0) + 1; });
  const dates = Object.keys(counts).sort();
  const initial = selected || dates[0] || new Date().toISOString().slice(0, 10);
  const [ym, setYm] = useState(() => {
    const [y, m] = initial.split("-");
    return { y: +y, m: +m - 1 };
  });

  const startDow = new Date(ym.y, ym.m, 1).getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);
  const iso = (d: number) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevM = () => setYm((p) => (p.m - 1 < 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 }));
  const nextM = () => setYm((p) => (p.m + 1 > 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="crop-box cal-box" onClick={(e) => e.stopPropagation()}>
        <h4 className="crop-title">🗓 ランチ会の日程</h4>
        <p className="crop-help">日にちをえらぶと、その日のメンバーだけ表示するよ<br />（アンダーバーのある日はランチ会あり♪）</p>
        <div className="cal-nav">
          <button className="icon-btn" onClick={prevM}><Icon name="back" size={18} /></button>
          <div className="cal-month">{ym.y}年 {ym.m + 1}月</div>
          <button className="icon-btn" onClick={nextM}><Icon name="back" size={18} style={{ transform: "scaleX(-1)" }} /></button>
        </div>
        <div className="cal-grid cal-dow">
          {["日", "月", "火", "水", "木", "金", "土"].map((w, i) => (
            <span key={i} className={"cal-w" + (i === 0 ? " sun" : i === 6 ? " sat" : "")}>{w}</span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) => {
            if (d === null) return <span key={i} className="cal-cell empty" />;
            const di = iso(d);
            const has = counts[di] > 0;
            const sel = selected === di;
            return (
              <button
                key={i} disabled={!has}
                className={"cal-cell" + (has ? " has" : "") + (sel ? " sel" : "") + (di === todayIso ? " today" : "")}
                onClick={() => onSelect(di)}
              >
                <span className="cal-d">{d}</span>
                {has && <span className="cal-bar" />}
                {has && <span className="cal-cnt">{counts[di]}</span>}
              </button>
            );
          })}
        </div>
        <div className="cal-actions">
          {selected && <button className="btn ghost" onClick={() => onSelect(null)}>絞り込み解除</button>}
          <button className="btn" onClick={onClose}>とじる</button>
        </div>
      </div>
    </div>
  );
}
