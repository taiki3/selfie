/* 作成・編集フォーム — design screens.jsx の移植 */
import { useRef, useState } from "react";
import { AV_COLORS, Avatar, HeartShape, Portrait, StarShape } from "../components/Avatars";
import { Icon } from "../components/Icon";
import type { Dept, Draft } from "../types";
import { PhotoCropModal } from "./PhotoCropModal";

const AVATAR_OPTS = [0, 1, 2, 3, 4, 5, 6, 7];
const COLOR_OPTS = [0, 1, 2, 3, 4, 5];

export function EditorScreen({
  depts, draft, setDraft, onSave, isEdit,
}: {
  depts: Dept[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  isEdit: boolean;
}) {
  const [tagInput, setTagInput] = useState("");
  const [rawImg, setRawImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const d = depts[draft.deptIdx] || depts[0];

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setRawImg(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(f);
  };

  const addTag = () => {
    const v = tagInput.trim();
    if (v && draft.hobbies.length < 6 && !draft.hobbies.includes(v)) {
      setDraft({ ...draft, hobbies: [...draft.hobbies, v] });
    }
    setTagInput("");
  };

  const valid = Boolean(draft.nickname.trim() && draft.catch.trim() && /^\d{4}$/.test(draft.pin || ""));

  return (
    <div className="editor">
      <div className="section-head">
        <h2>{isEdit ? "プロフをへんしゅう" : "プロフを作ろう"}</h2>
        <span className="pill">{isEdit ? "edit" : "new"}</span>
      </div>

      <div className="editor-card" style={{ "--accent": d.soft } as React.CSSProperties}>
        {/* アバター / 写真 */}
        <div className="form-group">
          <label><HeartShape size={16} color={d.deep} /> 写真かキャラをえらぶ</label>
          <div className="avatar-picker">
            <div className="avatar-preview-wrap">
              <div className="avatar-preview" style={{ borderColor: d.deep }}>
                <Portrait photo={draft.photo} id={draft.avatar} color={draft.avColor} />
              </div>
              {draft.photo && (
                <button className="photo-del" title="写真を消す" onClick={() => setDraft({ ...draft, photo: null, photoDirty: true })}><Icon name="trash" size={16} /></button>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickFile} />
              <button className="btn ghost photo-btn" onClick={() => fileRef.current?.click()}>
                <Icon name="camera" size={18} /> {draft.photo ? "写真をかえる" : "写真をアップロード"}
              </button>
              <div className="photo-note">アップロードすると四角く切り抜けるよ📷</div>

              <div className="av-divider"><span>またはキャラから</span></div>
              <div className="avatar-grid" style={draft.photo ? { opacity: 0.45 } : undefined}>
                {AVATAR_OPTS.map((a) => (
                  <button
                    key={a}
                    className={"av-opt" + (!draft.photo && draft.avatar === a ? " sel" : "")}
                    onClick={() => setDraft({ ...draft, avatar: a, photo: null, photoDirty: draft.photo ? true : draft.photoDirty })}
                  >
                    <Avatar id={a} color={draft.avColor} />
                  </button>
                ))}
              </div>
              <div className="color-opts" style={{ marginTop: 12, ...(draft.photo ? { opacity: 0.45 } : {}) }}>
                {COLOR_OPTS.map((cI) => (
                  <button
                    key={cI}
                    className={"color-opt" + (!draft.photo && draft.avColor === cI ? " sel" : "")}
                    style={{ background: AV_COLORS[cI].body }}
                    onClick={() => setDraft({ ...draft, avColor: cI, photo: null, photoDirty: draft.photo ? true : draft.photoDirty })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ニックネーム */}
        <div className="form-group">
          <label><StarShape size={16} color={d.deep} /> ニックネーム<span style={{ color: d.deep }}>＊</span></label>
          <input className="txt" value={draft.nickname} maxLength={12} placeholder="ぴょん" onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} />
        </div>

        {/* 本名 */}
        <div className="form-group">
          <label><StarShape size={16} color={d.deep} /> なまえ</label>
          <input className="txt" value={draft.fullname} maxLength={20} placeholder="高橋 美咲" onChange={(e) => setDraft({ ...draft, fullname: e.target.value })} />
        </div>

        {/* 部署 */}
        <div className="form-group">
          <label><StarShape size={16} color={d.deep} /> しょぞく・チーム</label>
          <div className="color-opts" style={{ gap: 8 }}>
            {depts.map((dp, i) => (
              <button
                key={i}
                className="filter-chip"
                style={draft.deptIdx === i ? { background: dp.deep, color: "#fff", boxShadow: `0 3px 0 ${dp.deep}` } : { boxShadow: `0 3px 0 ${dp.soft}` }}
                onClick={() => setDraft({ ...draft, deptIdx: i })}
              >{dp.name}</button>
            ))}
          </div>
        </div>

        {/* キャッチコピー */}
        <div className="form-group">
          <label><HeartShape size={16} color={d.deep} /> キャッチコピー<span style={{ color: d.deep }}>＊</span></label>
          <span className="char-count">{draft.catch.length}/30</span>
          <input className="txt" value={draft.catch} maxLength={30} placeholder="毎日にときめきを探してます♡" onChange={(e) => setDraft({ ...draft, catch: e.target.value })} />
        </div>

        {/* 趣味タグ */}
        <div className="form-group">
          <label><HeartShape size={16} color={d.deep} /> すきな・とくいなこと（さいだい6こ）</label>
          <div className="tag-input-row">
            {draft.hobbies.map((h, i) => (
              <span className="tag-chip" key={i} style={{ background: d.soft, color: d.deep }}>{h}
                <button onClick={() => setDraft({ ...draft, hobbies: draft.hobbies.filter((_, j) => j !== i) })}>×</button>
              </span>
            ))}
            {draft.hobbies.length < 6 && (
              <span style={{ display: "inline-flex", gap: 6 }}>
                <input
                  className="txt" style={{ width: 130, padding: "7px 12px" }} value={tagInput}
                  placeholder="カフェめぐり" maxLength={10}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
                <button className="tag-add" onClick={addTag}>＋ついか</button>
              </span>
            )}
          </div>
        </div>

        {/* 最近あったよかったこと */}
        <div className="form-group">
          <label><HeartShape size={16} color={d.deep} /> 最近あったよかったこと</label>
          <span className="char-count">{draft.recent.length}/100</span>
          <textarea className="ta" value={draft.recent} maxLength={100} placeholder="近所に新しいカフェができて、いちごラテが最高だった♪" onChange={(e) => setDraft({ ...draft, recent: e.target.value })} />
        </div>

        {/* 今年の抱負 */}
        <div className="form-group">
          <label><HeartShape size={16} color={d.deep} /> 今年の抱負</label>
          <input className="txt" value={draft.resolution} maxLength={40} placeholder="おかし作りの腕を上げてみんなに配る！" onChange={(e) => setDraft({ ...draft, resolution: e.target.value })} />
        </div>

        {/* やってみたい・行ってみたい */}
        <div className="form-group">
          <label><HeartShape size={16} color={d.deep} /> やってみたいこと・行ってみたい場所</label>
          <input className="txt" value={draft.wishlist} maxLength={40} placeholder="オーロラを見にフィンランドへ行きたい" onChange={(e) => setDraft({ ...draft, wishlist: e.target.value })} />
        </div>

        {/* あんしょう番号 PIN */}
        <div className="form-group pin-group">
          <label><Icon name="check" size={16} /> あんしょう番号（PIN・4桁）<span style={{ color: d.deep }}>＊</span></label>
          <input
            className="txt pin-field" inputMode="numeric" type="text" maxLength={4}
            value={draft.pin || ""} placeholder="0000"
            onChange={(e) => setDraft({ ...draft, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
          <p className="help">{isEdit ? "ここで暗証番号を変更できるよ。次回の編集から新しいPINが必要になるよ" : "編集するときに必要になるよ。忘れない番号にしてね！"}</p>
        </div>

        <button
          className="btn lg" style={{ width: "100%", background: d.deep, boxShadow: `0 6px 0 ${d.deep}` }}
          disabled={!valid} onClick={onSave}
        >
          <Icon name="check" size={20} /> {isEdit ? "ほぞんする" : "シートを完成！"}
        </button>
        {!valid && <p className="help" style={{ textAlign: "center" }}>＊ニックネーム・キャッチコピー・PIN（4桁）は必須だよ</p>}
      </div>

      {rawImg && (
        <PhotoCropModal
          src={rawImg}
          onCancel={() => setRawImg(null)}
          onDone={(url) => { setDraft({ ...draft, photo: url, photoDirty: true }); setRawImg(null); }}
        />
      )}
    </div>
  );
}
