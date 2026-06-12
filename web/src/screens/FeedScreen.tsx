/* フィード — design screens.jsx の移植 */
import { useState } from "react";
import { Icon } from "../components/Icon";
import { ProfileCard } from "../components/ProfileCard";
import type { Dept, Sheet } from "../types";
import { isoToJP } from "./util";
import { LunchCalendar } from "./LunchCalendar";

export type Filter = "all" | number;

export function FeedScreen({
  sheets, depts, onOpen, filter, setFilter, lunchFilter, setLunchFilter,
}: {
  sheets: Sheet[];
  depts: Dept[];
  onOpen: (id: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  lunchFilter: string | null;
  setLunchFilter: (iso: string | null) => void;
}) {
  const [calOpen, setCalOpen] = useState(false);
  const byDept = filter === "all" ? sheets : sheets.filter((s) => s.deptIdx === filter);
  const filtered = lunchFilter ? byDept.filter((s) => s.lunchDate === lunchFilter) : byDept;

  return (
    <div>
      <div className="section-head">
        <h2>みんなのプロフ</h2>
        <span className="pill">{sheets.length}にん</span>
        <button className="cal-btn" onClick={() => setCalOpen(true)}>
          <Icon name="calendar" size={18} /> ランチ会日程
        </button>
      </div>

      {lunchFilter && (
        <div className="lunch-filter-bar">
          <span className="lfb-cal"><Icon name="calendar" size={16} /></span>
          <span className="lfb-text">{isoToJP(lunchFilter)} のランチ会メンバー</span>
          <span className="lfb-count">{filtered.length}にん</span>
          <button className="lfb-clear" onClick={() => setLunchFilter(null)} aria-label="解除"><Icon name="x" size={16} /></button>
        </div>
      )}

      <div className="filter-row">
        <button className={"filter-chip" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>ぜんいん</button>
        {depts.map((d, i) => (
          <button key={i} className={"filter-chip" + (filter === i ? " on" : "")} onClick={() => setFilter(i)}>{d.name}</button>
        ))}
      </div>

      <div className="feed">
        {filtered.map((s) => (
          <ProfileCard key={s.id} sheet={s} depts={depts} onClick={() => onOpen(s.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <h3>{lunchFilter ? "この日のメンバーはまだいないよ" : "まだ だれもいないよ"}</h3>
          <p>{lunchFilter ? "別の日にちをえらんでみてね🗓" : "この部署のプロフはこれからです！"}</p>
        </div>
      )}

      {calOpen && (
        <LunchCalendar
          sheets={sheets} selected={lunchFilter}
          onClose={() => setCalOpen(false)}
          onSelect={(iso) => { setLunchFilter(iso); setCalOpen(false); }}
        />
      )}
    </div>
  );
}
