/* プロフカード (フィード用) — design components.jsx の移植 */
import type { CSSProperties } from "react";
import type { Dept, Sheet } from "../types";
import { HeartShape, Portrait } from "./Avatars";

export function ProfileCard({ sheet, depts, onClick }: { sheet: Sheet; depts: Dept[]; onClick: () => void }) {
  const d = depts[sheet.deptIdx] || depts[0];
  const totalReact = Object.values(sheet.reactions || {}).reduce((a, b) => a + b, 0);
  const accentVars = { "--accent": d.soft, "--accent-deep": d.deep } as CSSProperties;
  return (
    <article className="pcard" style={accentVars} onClick={onClick}>
      <div className="pcard-top">
        <div className="avatar-wrap">
          <div className="avatar" style={{ borderColor: d.deep }}>
            <Portrait photo={sheet.photo} id={sheet.avatar} color={sheet.avColor} />
          </div>
        </div>
        <div className="name-block">
          <div className="nickname">{sheet.nickname}</div>
          <div className="fullname">{sheet.fullname}</div>
        </div>
      </div>

      <p className="catch">{sheet.catch}</p>

      <div className="tag-row">
        {(sheet.hobbies || []).slice(0, 3).map((h, i) => (
          <span className="tag" key={i}>{h}</span>
        ))}
      </div>

      <div className="pcard-foot">
        <span className="dept-chip"><span className="dot" />{d.name}</span>
        <span className="react-count"><HeartShape size={15} color={d.deep} />{totalReact}</span>
      </div>
    </article>
  );
}
