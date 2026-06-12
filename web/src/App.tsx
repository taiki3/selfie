import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type SheetPayload } from "./api";
import { Avatar, ConfettiField } from "./components/Avatars";
import { Icon } from "./components/Icon";
import { SettingsPanel } from "./components/SettingsPanel";
import { DEPTS, emptyDraft, FONT_STACKS, STYLE_NAMES, THEME_NAMES } from "./data";
import { useSettings } from "./lib/useSettings";
import { DetailSheet } from "./screens/DetailSheet";
import { EditorScreen } from "./screens/EditorScreen";
import { type Filter, FeedScreen } from "./screens/FeedScreen";
import { MyScreen } from "./screens/MyScreen";
import { AdminPrompt, PinPrompt } from "./screens/Prompts";
import type { Draft, ReactionKey, Sheet } from "./types";

const MY_ID_KEY = "selfie_my_id";

type Tab = "home" | "create" | "my";

export default function App() {
  const { settings, update, applyStyle } = useSettings();

  const [tab, setTab] = useState<Tab>("home");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(() => {
    try { return localStorage.getItem(MY_ID_KEY); } catch { return null; }
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editPin, setEditPin] = useState(""); // verified PIN carried into an edit
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [lunchFilter, setLunchFilter] = useState<string | null>(null);
  const [pinGate, setPinGate] = useState<{ sheetId: string; error: boolean } | null>(null);
  const [adminPrompt, setAdminPrompt] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // Initial load: sheets + admin status.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, isAdmin] = await Promise.all([api.listSheets(), api.adminStatus()]);
        if (!alive) return;
        setSheets(list);
        setAdmin(isAdmin);
      } catch (err) {
        if (alive) setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました");
      }
    })();
    return () => { alive = false; };
  }, []);

  // Apply theme / font / decoration to CSS variables (mirrors the prototype).
  useEffect(() => {
    const [main, deep, soft] = settings.theme;
    const root = document.documentElement.style;
    root.setProperty("--theme", main);
    root.setProperty("--theme-deep", deep);
    root.setProperty("--theme-soft", soft);
    root.setProperty("--bg-dots", soft);
    document.body.style.background = `radial-gradient(circle at 50% 0, #fff 0, transparent 60%), ${soft}55`;
    root.setProperty("--font-pop", FONT_STACKS[settings.round] || FONT_STACKS.pop);
    root.setProperty("--deco", settings.deco === "off" ? "0" : settings.deco === "lots" ? "1" : "0.7");
  }, [settings]);

  const rememberMyId = (id: string | null) => {
    setMyId(id);
    try {
      if (id) localStorage.setItem(MY_ID_KEY, id);
      else localStorage.removeItem(MY_ID_KEY);
    } catch { /* ignore */ }
  };

  const patchSheet = (id: string, patch: Partial<Sheet>) =>
    setSheets((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const mySheet = sheets.find((s) => s.id === myId) ?? null;
  const openSheet = sheets.find((s) => s.id === openId) ?? null;

  const handleReact = async (id: string, key: ReactionKey) => {
    // Optimistic toggle so the tap feels instant; reconcile with the server.
    const cur = sheets.find((s) => s.id === id);
    if (cur) {
      const on = cur.myReactions.includes(key);
      patchSheet(id, {
        reactions: { ...cur.reactions, [key]: cur.reactions[key] + (on ? -1 : 1) },
        myReactions: on ? cur.myReactions.filter((k) => k !== key) : [...cur.myReactions, key],
      });
    }
    try {
      const res = await api.toggleReaction(id, key);
      patchSheet(id, { reactions: res.reactions, myReactions: res.myReactions });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "リアクションに失敗しました");
      try { patchSheet(id, await api.getSheet(id)); } catch { /* ignore */ }
    }
  };

  const handleComment = async (id: string, text: string) => {
    const me = mySheet
      ? { by: mySheet.nickname, avatar: mySheet.avatar, avColor: mySheet.avColor }
      : { by: "ゲスト", avatar: 4, avColor: 4 };
    try {
      const comment = await api.addComment(id, { ...me, text });
      const cur = sheets.find((s) => s.id === id);
      if (cur) patchSheet(id, { comments: [...cur.comments, comment] });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "コメントに失敗しました");
    }
  };

  const startCreate = () => {
    setEditId(null);
    setEditPin("");
    setDraft(emptyDraft());
    setTab("create");
  };

  // Editing (own or others') is gated by the PIN, verified server-side.
  const requestEdit = (sheetId: string) => setPinGate({ sheetId, error: false });

  const confirmPin = async (input: string) => {
    if (!pinGate) return;
    try {
      const ok = await api.verifyPin(pinGate.sheetId, input);
      if (!ok) { setPinGate((g) => (g ? { ...g, error: true } : g)); return; }
      const s = sheets.find((x) => x.id === pinGate.sheetId);
      if (!s) { setPinGate(null); return; }
      setEditId(s.id);
      setEditPin(input);
      setDraft({
        nickname: s.nickname, fullname: s.fullname, avatar: s.avatar, avColor: s.avColor,
        deptIdx: s.deptIdx, catch: s.catch, hobbies: [...s.hobbies], recent: s.recent,
        resolution: s.resolution, wishlist: s.wishlist,
        photo: s.photo, photoDirty: false, pin: input,
      });
      setTab("create");
      setPinGate(null);
      setOpenId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "認証に失敗しました");
    }
  };

  const tryAdminLogin = async (pwd: string): Promise<boolean> => {
    try {
      const ok = await api.adminLogin(pwd);
      if (ok) {
        setAdmin(true);
        setAdminPrompt(false);
        showToast("管理者モードON 🔑");
      }
      return ok;
    } catch {
      return false;
    }
  };

  const adminLogout = async () => {
    try { await api.adminLogout(); } catch { /* ignore */ }
    setAdmin(false);
    showToast("管理者モードOFF");
  };

  const handleSetLunch = async (id: string, date: string) => {
    try {
      const updated = await api.setLunchDate(id, date);
      patchSheet(id, { lunchDate: updated.lunchDate });
      showToast(date ? "日程を保存したよ" : "日程をクリアしたよ");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "保存に失敗しました");
    }
  };

  const draftToPayload = (forEdit: boolean): SheetPayload => {
    const base: SheetPayload = {
      nickname: draft.nickname, fullname: draft.fullname, avatar: draft.avatar,
      avColor: draft.avColor, deptIdx: draft.deptIdx, catch: draft.catch,
      hobbies: draft.hobbies, recent: draft.recent, resolution: draft.resolution,
      wishlist: draft.wishlist, pin: forEdit ? editPin : draft.pin,
    };
    if (forEdit) base.newPin = draft.pin;
    // Only send the photo when it actually changed (null = clear, dataURL = new).
    if (draft.photoDirty) base.photo = draft.photo && draft.photo.startsWith("data:") ? draft.photo : null;
    else if (!forEdit && draft.photo && draft.photo.startsWith("data:")) base.photo = draft.photo;
    return base;
  };

  const saveDraft = async () => {
    try {
      if (editId) {
        const updated = await api.updateSheet(editId, draftToPayload(true));
        setSheets((ss) => ss.map((s) => (s.id === editId ? updated : s)));
        showToast("ほぞんしたよ♪");
      } else {
        const created = await api.createSheet(draftToPayload(false));
        setSheets((ss) => [created, ...ss]);
        rememberMyId(created.id);
        showToast("プロフ完成！🎉");
      }
      setEditId(null);
      setEditPin("");
      setTab("my");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "保存に失敗しました");
    }
  };

  const decoLevel = settings.deco;

  return (
    <div className={"app" + (decoLevel !== "off" ? " dot-bg" : "")} data-style={settings.style}>
      {decoLevel === "lots" && settings.style === "pop" && <ConfettiField />}

      <header className="app-header">
        <div className="brand">
          <span className="brand-mark"><Avatar id={0} color={0} /></span>
          プロフ帳
        </div>
        <div className="header-actions">
          <span className="pill" style={{ fontFamily: "var(--font-pop)", fontSize: 12, background: "var(--theme)", color: "#fff", padding: "5px 13px", borderRadius: 99, boxShadow: "0 3px 0 var(--theme-deep)" }}>
            {STYLE_NAMES[settings.style]}・{THEME_NAMES[settings.theme[0]] ?? "テーマ"}
          </span>
          <button className="admin-chip" onClick={() => setSettingsOpen(true)} title="デザイン設定">
            <Icon name="gear" size={16} />
          </button>
          {admin ? (
            <button className="admin-chip on" onClick={() => void adminLogout()} title="管理者モードをやめる">🔑 管理者ON</button>
          ) : (
            <button className="admin-chip" onClick={() => setAdminPrompt(true)}>🔒 管理者</button>
          )}
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1 }}>
        {loadError && (
          <div className="empty">
            <h3>よみこみに失敗しました</h3>
            <p>{loadError}</p>
            <button className="btn" onClick={() => location.reload()}>もう一回</button>
          </div>
        )}
        {!loadError && tab === "home" && (
          <FeedScreen
            sheets={sheets} depts={DEPTS} onOpen={setOpenId}
            filter={filter} setFilter={setFilter}
            lunchFilter={lunchFilter} setLunchFilter={setLunchFilter}
          />
        )}
        {!loadError && tab === "create" && (
          <EditorScreen depts={DEPTS} draft={draft} setDraft={setDraft} onSave={() => void saveDraft()} isEdit={!!editId} />
        )}
        {!loadError && tab === "my" && (
          <MyScreen
            mySheet={mySheet} depts={DEPTS} onOpen={setOpenId}
            onEdit={() => myId && requestEdit(myId)} onCreate={startCreate}
          />
        )}
      </main>

      <nav className="tabbar">
        <button className={"tab" + (tab === "home" ? " active" : "")} onClick={() => setTab("home")}>
          <Icon name="home" /> ホーム
        </button>
        <button className="tab create-tab" onClick={startCreate} aria-label="作成">
          <span className="fab"><Icon name="plus" size={28} /></span>
        </button>
        <button className={"tab" + (tab === "my" ? " active" : "")} onClick={() => setTab("my")}>
          <Icon name="user" /> マイシート
        </button>
      </nav>

      {openSheet && (
        <DetailSheet
          sheet={openSheet} depts={DEPTS} onClose={() => setOpenId(null)}
          onReact={(id, k) => void handleReact(id, k)} onComment={(id, t) => void handleComment(id, t)}
          admin={admin} onSetLunch={(id, date) => void handleSetLunch(id, date)} onRequestEdit={requestEdit}
        />
      )}

      {pinGate && (
        <PinPrompt error={pinGate.error} onCancel={() => setPinGate(null)} onSubmit={(pin) => void confirmPin(pin)} />
      )}

      {adminPrompt && (
        <AdminPrompt onCancel={() => setAdminPrompt(false)} onSubmit={tryAdminLogin} />
      )}

      {toast && <div className="toast">{toast}</div>}

      <SettingsPanel
        open={settingsOpen} settings={settings}
        onClose={() => setSettingsOpen(false)}
        onApplyStyle={applyStyle} onUpdate={update}
      />
    </div>
  );
}
