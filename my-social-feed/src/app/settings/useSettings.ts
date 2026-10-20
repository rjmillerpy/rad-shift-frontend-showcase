"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const SAVED_NOTICE_MS = 2000;

/** Load, edit and save one settings document (/profile/me/<name>-settings).
    The server's values are merged over the page's defaults, so a setting
    added later still has a value for users who saved before it existed. */
export function useSettings<T extends object>(name: string, defaults: T) {
  const { token } = useAuth();
  const path = `/profile/me/${name}-settings`;
  const [settings, setSettings] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    // The token arrives after the first render (useAuth reads it in an
    // effect), by which point loading was already marked done. Mark it
    // again, or the page shows the defaults as if they were the user's
    // and a quick Save would overwrite their real settings with them.
    setLoading(true);
    api.get(path)
      .then((res) => setSettings({ ...defaults, ...res.data }))
      .catch((e) => { console.error("Error loading %s settings:", name, e); })
      .finally(() => setLoading(false));
  }, [token, path, name, defaults]); // defaults: a module constant on every page, so stable

  const save = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await api.put(path, settings);
      setSettings({ ...defaults, ...res.data });
      setSaved(true);
      setTimeout(() => setSaved(false), SAVED_NOTICE_MS);
    } catch (e) {
      console.error("Error saving %s settings:", name, e);
    } finally {
      setSaving(false);
    }
  }, [token, path, settings, defaults, name]);

  const reset = useCallback(() => setSettings(defaults), [defaults]);

  return { token, settings, setSettings, loading, saving, saved, save, reset };
}
