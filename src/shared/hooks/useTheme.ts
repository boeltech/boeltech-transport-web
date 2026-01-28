/**
 * useTheme Hook
 *
 * Hook para acceder y manipular el tema de la aplicación.
 * Debe usarse dentro de ThemeProvider.
 *
 * Ubicación: src/shared/hooks/useTheme.ts
 *
 * @example
 * const { mode, resolvedTheme, isDark, setMode, toggleTheme } = useTheme();
 *
 * // Cambiar a modo oscuro
 * setMode('dark');
 *
 * // Alternar tema
 * toggleTheme();
 *
 * // Condicional por tema
 * if (isDark) { ... }
 */

import { useContext } from "react";
import { ThemeContext } from "@/app/providers/ThemeProvider";
import type { ThemeContextValue } from "@/shared/ui/theme/types";

/**
 * Hook para acceder al contexto del tema
 * @throws Error si se usa fuera de ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme debe usarse dentro de un ThemeProvider. " +
        "Asegúrate de envolver tu aplicación con <ThemeProvider>.",
    );
  }

  return context;
}

// Re-exportar tipos para conveniencia
export type {
  ThemeMode,
  ResolvedTheme,
  ThemeContextValue,
} from "@/shared/ui/theme/types";
