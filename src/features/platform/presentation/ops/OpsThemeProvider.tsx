/* eslint-disable react-refresh/only-export-components */
/**
 * Provider de tema Ops — scope `.platform-ops` + `data-ops-theme`.
 * No toca ThemeProvider ERP ni `html.dark`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getInitialOpsResolvedTheme,
  getInitialOpsThemeMode,
  getSystemPrefersDark,
  resolveOpsTheme,
  writeStoredOpsThemeMode,
  type OpsResolvedTheme,
  type OpsThemeMode,
} from "./opsTheme";
import {
  clearOpsThemeBridge,
  getOpsThemeBridge,
  registerOpsThemeBridge,
} from "./opsThemeBridge";

export interface OpsThemeContextValue {
  mode: OpsThemeMode;
  resolved: OpsResolvedTheme;
  setMode: (mode: OpsThemeMode) => void;
}

const OpsThemeContext = createContext<OpsThemeContextValue | undefined>(
  undefined,
);

export function OpsThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OpsThemeMode>(getInitialOpsThemeMode);
  const [prefersDark, setPrefersDark] = useState(getSystemPrefersDark);

  const resolved = resolveOpsTheme(mode, prefersDark);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  useEffect(() => {
    registerOpsThemeBridge(resolved);
    return () => {
      clearOpsThemeBridge();
    };
  }, [resolved]);

  const setMode = useCallback((next: OpsThemeMode) => {
    setModeState(next);
    writeStoredOpsThemeMode(next);
    if (next === "system") {
      setPrefersDark(getSystemPrefersDark());
    }
  }, []);

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return (
    <OpsThemeContext.Provider value={value}>{children}</OpsThemeContext.Provider>
  );
}

export function useOpsTheme(): OpsThemeContextValue {
  const ctx = useContext(OpsThemeContext);
  if (!ctx) {
    throw new Error(
      "useOpsTheme debe usarse dentro de OpsThemeProvider (consola Ops).",
    );
  }
  return ctx;
}

/**
 * Tema resuelto para portales / fallbacks: context → bridge → initial sync.
 * No lanza si falta el provider.
 */
export function useOpsResolvedTheme(): OpsResolvedTheme {
  const ctx = useContext(OpsThemeContext);
  if (ctx) return ctx.resolved;
  return getOpsThemeBridge() ?? getInitialOpsResolvedTheme();
}
