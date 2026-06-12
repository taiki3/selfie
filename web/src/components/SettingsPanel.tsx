/* デザイン設定パネル — 元 tweaks-panel.jsx の置き換え（ホスト連携を除いた自前UI） */
import {
  type DecoKey, type RoundKey, type Settings, type StyleKey,
  STYLE_NAMES, THEME_NAMES, THEME_OPTIONS,
} from "../data";
import { Icon } from "./Icon";

function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={"seg-btn" + (o.value === value ? " on" : "")}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPanel({
  open, settings, onClose, onApplyStyle, onUpdate,
}: {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onApplyStyle: (s: StyleKey) => void;
  onUpdate: (patch: Partial<Settings>) => void;
}) {
  if (!open) return null;
  const themeKey = JSON.stringify(settings.theme).toLowerCase();
  return (
    <div className="settings-scrim" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="デザイン設定">
        <div className="settings-head">
          <b>デザイン設定</b>
          <button className="settings-x" aria-label="とじる" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="settings-body">
          <div className="settings-sect">スタイル</div>
          <Segmented<StyleKey>
            value={settings.style}
            options={[
              { value: "pop", label: STYLE_NAMES.pop },
              { value: "teen", label: STYLE_NAMES.teen },
              { value: "min", label: STYLE_NAMES.min },
            ]}
            onChange={onApplyStyle}
          />

          <div className="settings-sect">テーマカラー</div>
          <div className="settings-chips">
            {THEME_OPTIONS.map((t, i) => {
              const on = JSON.stringify(t).toLowerCase() === themeKey;
              return (
                <button
                  key={i}
                  type="button"
                  className={"settings-chip" + (on ? " on" : "")}
                  title={THEME_NAMES[t[0]] ?? ""}
                  aria-label={THEME_NAMES[t[0]] ?? t[0]}
                  style={{ background: t[0] }}
                  onClick={() => onUpdate({ theme: t })}
                >
                  {on && <span className="settings-chip-check">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="settings-sect">見出しフォント</div>
          <Segmented<RoundKey>
            value={settings.round}
            options={[
              { value: "pop", label: "まる" },
              { value: "round", label: "すっきり" },
              { value: "hand", label: "手書き" },
            ]}
            onChange={(round) => onUpdate({ round })}
          />

          <div className="settings-sect">キラキラ装飾</div>
          <Segmented<DecoKey>
            value={settings.deco}
            options={[
              { value: "off", label: "なし" },
              { value: "normal", label: "ふつう" },
              { value: "lots", label: "たっぷり" },
            ]}
            onChange={(deco) => onUpdate({ deco })}
          />
        </div>
      </div>
    </div>
  );
}
