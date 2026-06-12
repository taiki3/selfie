/* 詳細シート (リアクション & コメント) — design screens.jsx の移植 */
import { useEffect, useRef, useState } from "react";
import { Avatar, Portrait } from "../components/Avatars";
import { Icon } from "../components/Icon";
import { REACTIONS } from "../data";
import type { Dept, ReactionKey, Sheet } from "../types";
import { isoToJP } from "./util";

export function DetailSheet({
  sheet, depts, onClose, onReact, onComment, admin, onSetLunch, onRequestEdit,
}: {
  sheet: Sheet;
  depts: Dept[];
  onClose: () => void;
  onReact: (id: string, key: ReactionKey) => void;
  onComment: (id: string, text: string) => void;
  admin: boolean;
  onSetLunch: (id: string, date: string) => void;
  onRequestEdit: (id: string) => void;
}) {
  const d = depts[sheet.deptIdx] || depts[0];
  const [pulse, setPulse] = useState<ReactionKey | null>(null);
  const [text, setText] = useState("");
  const [lunch, setLunch] = useState(sheet.lunchDate || "");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setLunch(sheet.lunchDate || ""); }, [sheet.id, sheet.lunchDate]);

  const react = (k: ReactionKey) => {
    onReact(sheet.id, k);
    setPulse(k);
    setTimeout(() => setPulse(null), 420);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onComment(sheet.id, text.trim());
    setText("");
    setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 60);
  };

  const myReactions = new Set(sheet.myReactions);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" style={{ "--accent": d.soft } as React.CSSProperties} onClick={(e) => e.stopPropagation()}>
        <button className="close-x" onClick={onClose}><Icon name="x" size={20} /></button>
        <button className="edit-x" onClick={() => onRequestEdit(sheet.id)} title="このシートを編集"><Icon name="edit" size={18} /></button>
        <div className="sheet-hero">
          <div className="big-avatar" style={{ borderColor: "#fff", boxShadow: `0 8px 0 ${d.deep}33` }}>
            <Portrait photo={sheet.photo} id={sheet.avatar} color={sheet.avColor} />
          </div>
          <div className="nickname">{sheet.nickname}</div>
          <div className="fullname">{sheet.fullname}・{d.name}</div>
        </div>

        <div className="sheet-body">
          <div className="field">
            <span className="field-label" style={{ background: d.soft, color: d.deep }}>キャッチコピー</span>
            <div className="field-value catch" style={{ color: d.deep }}>{sheet.catch}</div>
          </div>

          <div className="field">
            <span className="field-label" style={{ background: d.soft, color: d.deep }}>すきな・とくいなこと</span>
            <div className="tag-row">
              {sheet.hobbies.map((h, i) => <span className="tag" key={i} style={{ background: d.soft, color: d.deep }}>{h}</span>)}
            </div>
          </div>

          {sheet.recent && (
            <div className="field">
              <span className="field-label" style={{ background: d.soft, color: d.deep }}>最近あったよかったこと</span>
              <div className="field-value">{sheet.recent}</div>
            </div>
          )}

          {sheet.resolution && (
            <div className="field">
              <span className="field-label" style={{ background: d.soft, color: d.deep }}>今年の抱負</span>
              <div className="field-value">{sheet.resolution}</div>
            </div>
          )}

          {sheet.wishlist && (
            <div className="field">
              <span className="field-label" style={{ background: d.soft, color: d.deep }}>やってみたい・行ってみたい</span>
              <div className="field-value">{sheet.wishlist}</div>
            </div>
          )}

          {/* 昼食会の日程（個人は入力不可・管理者のみ入力） */}
          <div className="field lunch-field">
            <span className="field-label lunch-label">🍱 昼食会の日程</span>
            {admin ? (
              <div className="lunch-admin">
                <input type="date" className="txt lunch-input" value={lunch} onChange={(e) => setLunch(e.target.value)} />
                <button className="btn" style={{ background: d.deep, boxShadow: `0 4px 0 ${d.deep}` }} onClick={() => onSetLunch(sheet.id, lunch)}><Icon name="check" size={16} /> 保存</button>
                {sheet.lunchDate && <button className="btn ghost" onClick={() => { setLunch(""); onSetLunch(sheet.id, ""); }}>クリア</button>}
              </div>
            ) : (
              <div className={"lunch-value" + (sheet.lunchDate ? " set" : "")}>
                {isoToJP(sheet.lunchDate)}
                <span className="lunch-note">{sheet.lunchDate ? "" : "（管理者が入力します）"}</span>
              </div>
            )}
          </div>

          {/* リアクション */}
          <div className="react-bar">
            {REACTIONS.map((r) => {
              const on = myReactions.has(r.key);
              return (
                <button
                  key={r.key}
                  className={"react-btn" + (on ? " on" : "") + (pulse === r.key ? " pulse" : "")}
                  onClick={() => react(r.key)}
                  style={on ? { background: d.soft, color: d.deep, boxShadow: `0 3px 0 ${d.deep}, inset 0 0 0 2px ${d.deep}` } : undefined}
                >
                  <span className="emo">{r.emo}</span>
                  <span className="n">{sheet.reactions[r.key] || 0}</span>
                </button>
              );
            })}
          </div>

          {/* コメント */}
          <div className="comments">
            <h4><Icon name="users" size={18} /> コメント（{sheet.comments.length}）</h4>
            <div ref={listRef} style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
              {sheet.comments.length === 0 && (
                <p style={{ color: "var(--ink-faint)", fontSize: 13, textAlign: "center", padding: "10px 0" }}>いちばんのりでコメントしよ♪</p>
              )}
              {sheet.comments.map((c, i) => (
                <div className="comment" key={i}>
                  <div className="c-av"><Avatar id={c.avatar} color={c.avColor} /></div>
                  <div>
                    <div className="c-name">{c.by}</div>
                    <div className="bubble" style={{ background: d.soft }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <form className="comment-form" onSubmit={submit}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="コメントをかく…" maxLength={60} />
              <button type="submit" className="icon-btn" style={{ background: d.deep, color: "#fff", boxShadow: `0 4px 0 ${d.deep}` }}><Icon name="send" size={20} /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
