/* PIN認証 / 管理者ログイン モーダル — design screens.jsx の移植 */
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";

/** 編集前のPIN認証。onSubmit は検証成功で true を返すと閉じる。 */
export function PinPrompt({
  error, onCancel, onSubmit,
}: { error: boolean; onCancel: () => void; onSubmit: (pin: string) => void }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const go = () => { if (v.length === 4) onSubmit(v); };
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="crop-box pin-box" onClick={(e) => e.stopPropagation()}>
        <div className="pin-emoji">🔑</div>
        <h4 className="crop-title">あんしょう番号（PIN）</h4>
        <p className="crop-help">このシートを編集するには4桁のPINを入れてね</p>
        <input
          ref={ref}
          className={"pin-input" + (error ? " err" : "")}
          inputMode="numeric" type="password" maxLength={4} value={v} placeholder="････"
          onChange={(e) => setV(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => { if (e.key === "Enter") go(); }}
        />
        {error && <p className="pin-err">PINがちがうみたい…もう一回！</p>}
        <div className="crop-actions">
          <button className="btn ghost" onClick={onCancel}>やめる</button>
          <button className="btn" disabled={v.length !== 4} onClick={go}><Icon name="check" size={18} /> 編集する</button>
        </div>
      </div>
    </div>
  );
}

/** 管理者ログイン。onSubmit は成功で true を返す。 */
export function AdminPrompt({
  onCancel, onSubmit,
}: { onCancel: () => void; onSubmit: (pwd: string) => Promise<boolean> | boolean }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const go = async () => {
    if (!v) return;
    const ok = await onSubmit(v);
    if (!ok) setErr(true);
  };
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="crop-box pin-box" onClick={(e) => e.stopPropagation()}>
        <div className="pin-emoji">🔒</div>
        <h4 className="crop-title">管理者ログイン</h4>
        <p className="crop-help">パスワードを入れると、誰のシートでも<br />昼食会の日程を入力できるようになるよ</p>
        <input
          ref={ref}
          className={"pin-input wide" + (err ? " err" : "")}
          type="password" value={v} placeholder="パスワード"
          onChange={(e) => { setV(e.target.value); setErr(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") void go(); }}
        />
        {err && <p className="pin-err">パスワードがちがうみたい…</p>}
        <div className="crop-actions">
          <button className="btn ghost" onClick={onCancel}>やめる</button>
          <button className="btn" disabled={!v} onClick={() => void go()}><Icon name="check" size={18} /> ログイン</button>
        </div>
      </div>
    </div>
  );
}
