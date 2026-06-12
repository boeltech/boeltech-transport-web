/**
 * Toaster Component
 *
 * Renderiza el contenedor de toasts usando Sonner.
 * Se usa dentro del ToastProvider.
 *
 * Ubicación: src/shared/ui/toast/Toaster.tsx
 */

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@shared/hooks";
import type { ToasterConfig } from "./types";

type ToasterProps = ToasterConfig;

/**
 * Toaster
 *
 * Componente que renderiza los toasts.
 * Debe estar dentro de ThemeProvider para acceder al tema.
 */
export function Toaster({
  position = "top-right",
  duration = 4000,
  expand = false,
  closeButton = true,
  richColors = true,
}: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position={position}
      // Header is fixed (h-16, z-30). Offset toasts so they never render beneath it.
      offset={{ top: 80, right: 16, left: 16, bottom: 16 }}
      mobileOffset={{ top: 72, right: 12, left: 12, bottom: 12 }}
      className="z-[70]"
      duration={duration}
      expand={expand}
      closeButton={closeButton}
      richColors={richColors}
      toastOptions={{
        style: {
          // Fondo sólido para evitar que el contenido de la página se mezcle
          // visualmente con el toast. Tokens OKLCH — usar var() directo.
          background: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          opacity: 1,
          backdropFilter: "none",
        },
        className: "shadow-lg !bg-card !text-foreground !opacity-100 backdrop-blur-none",
      }}
    />
  );
}
