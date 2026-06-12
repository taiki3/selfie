import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, STYLE_PRESETS, type Settings, type StyleKey } from "../data";

const KEY = "selfie_settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* ignore malformed storage */
  }
  return DEFAULT_SETTINGS;
}

/**
 * localStorage-backed design settings. Replaces the design prototype's
 * useTweaks (which spoke a postMessage protocol to the Claude Design host).
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // Switching style also resets theme/deco/round to that style's defaults.
  const applyStyle = useCallback((style: StyleKey) => {
    const preset = STYLE_PRESETS[style] ?? STYLE_PRESETS.pop;
    setSettings((prev) => ({ ...prev, style, ...preset }));
  }, []);

  return { settings, update, applyStyle };
}
