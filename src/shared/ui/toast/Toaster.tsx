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

interface ToasterProps extends ToasterConfig {}

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
      duration={duration}
      expand={expand}
      closeButton={closeButton}
      richColors={richColors}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        className: "shadow-lg",
      }}
    />
  );
}
