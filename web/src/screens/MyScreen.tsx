/* マイシート — design screens.jsx の移植 */
import { Avatar } from "../components/Avatars";
import { Icon } from "../components/Icon";
import { ProfileCard } from "../components/ProfileCard";
import type { Dept, Sheet } from "../types";

export function MyScreen({
  mySheet, depts, onOpen, onEdit, onCreate,
}: {
  mySheet: Sheet | null;
  depts: Dept[];
  onOpen: (id: string) => void;
  onEdit: () => void;
  onCreate: () => void;
}) {
  if (!mySheet) {
    return (
      <div>
        <div className="section-head"><h2>マイシート</h2></div>
        <div className="empty">
          <div style={{ width: 110, height: 110, margin: "0 auto 18px" }}><Avatar id={0} color={0} /></div>
          <h3>まだプロフがないよ！</h3>
          <p>さいしょのプロフィールシートを作って<br />みんなに自己紹介しよう♪</p>
          <button className="btn lg" onClick={onCreate}><Icon name="plus" size={20} /> プロフを作る</button>
        </div>
      </div>
    );
  }
  const d = depts[mySheet.deptIdx] || depts[0];
  return (
    <div>
      <div className="section-head"><h2>マイシート</h2><span className="pill">わたしのプロフ</span></div>
      <div className="feed" style={{ gridTemplateColumns: "1fr", maxWidth: 460, margin: "0 auto" }}>
        <ProfileCard sheet={mySheet} depts={depts} onClick={() => onOpen(mySheet.id)} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
        <button className="btn ghost" onClick={onEdit}><Icon name="edit" size={18} /> へんしゅう</button>
        <button className="btn" style={{ background: d.deep, boxShadow: `0 5px 0 ${d.deep}` }} onClick={() => onOpen(mySheet.id)}><Icon name="share" size={18} /> プレビュー</button>
      </div>
    </div>
  );
}
