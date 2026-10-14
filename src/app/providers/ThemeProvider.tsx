/* eslint-disable react-refresh/only-export-components */
/**
 * ThemeProvider
 *
 * Provider que gestiona el tema (dark/light mode) y la paleta de color del DS.
 * Persiste preferencias en localStorage y escucha cambios del sistema.
 *
 * Ubicación: src/app/providers/ThemeProvider.tsx
 *
 * @example
 * <ThemeProvider defaultMode="system">
 *   <App />
 * </ThemeProvider>
 */

import {
  createContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ColorPaletteId,
  ThemeMode,
  ResolvedTheme,
  ThemeContextValue,
  ThemeProviderConfig,
} from "@/shared/ui/theme/types";
import {
  applyResolvedThemeToDocument,
  cycleThemeMode,
  readStoredThemeMode,
  resolveThemeFromMode,
  THEME_DEFAULT_MODE,
  THEME_STORAGE_KEY,
  writeStoredThemeMode,
} from "@/shared/ui/theme/themeRuntime";
import {
  applyColorPaletteToDocument,
  COLOR_PALETTE_DEFAULT,
  COLOR_PALETTE_STORAGE_KEY,
  cycleColorPalette as nextColorPalette,
  readStoredColorPalette,
  writeStoredColorPalette,
} from "@/shared/ui/theme/paletteRuntime";

// ============================================
// Context
// ============================================

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

// ============================================
// Provider
// ============================================

interface ThemeProviderProps extends ThemeProviderConfig {
  children: ReactNode;
}

export function ThemeProvider({
  children,
  defaultMode = THEME_DEFAULT_MODE,
  storageKey = THEME_STORAGE_KEY,
  attribute = "class",
  defaultColorPalette = COLOR_PALETTE_DEFAULT,
  colorPaletteStorageKey = COLOR_PALETTE_STORAGE_KEY,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return readStoredThemeMode(storageKey) ?? defaultMode;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    return resolveThemeFromMode(readStoredThemeMode(storageKey) ?? defaultMode);
  });

  const [colorPalette, setColorPaletteState] = useState<ColorPaletteId>(() => {
    return (
      readStoredColorPalette(colorPaletteStorageKey) ?? defaultColorPalette
    );
  });

  useLayoutEffect(() => {
    const updateTheme = () => {
      const resolved = resolveThemeFromMode(mode);
      setResolvedTheme(resolved);
      applyResolvedThemeToDocument(resolved, attribute);
    };

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = () => {
      if (mode === "system") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [mode, attribute]);

  useLayoutEffect(() => {
    applyColorPaletteToDocument(colorPalette);
  }, [colorPalette]);

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      writeStoredThemeMode(newMode, storageKey);
      setModeState(newMode);
    },
    [storageKey],
  );

  const setColorPalette = useCallback(
    (palette: ColorPaletteId) => {
      writeStoredColorPalette(palette, colorPaletteStorageKey);
      setColorPaletteState(palette);
    },
    [colorPaletteStorageKey],
  );

  const toggleTheme = useCallback(() => {
    const newMode = resolvedTheme === "dark" ? "light" : "dark";
    setMode(newMode);
  }, [resolvedTheme, setMode]);

  const cycleMode = useCallback(() => {
    setMode(cycleThemeMode(mode));
  }, [mode, setMode]);

  const cycleColorPalette = useCallback(() => {
    setColorPalette(nextColorPalette(colorPalette));
  }, [colorPalette, setColorPalette]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      isLight: resolvedTheme === "light",
      setMode,
      toggleTheme,
      cycleMode,
      colorPalette,
      setColorPalette,
      cycleColorPalette,
    }),
    [
      mode,
      resolvedTheme,
      setMode,
      toggleTheme,
      cycleMode,
      colorPalette,
      setColorPalette,
      cycleColorPalette,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
