/**
 * Toaster Component
 *
 * Renderiza el contenedor de toasts usando Sonner.
 * Se usa dentro del ToastProvider.
 *
 * Ubicación: src/shared/ui/toast/Toaster.tsx
 *
 * Excepción Ops (TEC §C.7): si `opsThemeBridge` está activo, el root usa
 * `.platform-ops` + `data-ops-theme` y theme Sonner = tema Ops (sin mutar html).
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@shared/hooks";
import {
  getOpsThemeBridge,
  subscribeOpsThemeBridge,
} from "@/features/platform/presentation/ops/opsThemeBridge";
import type { ToasterConfig } from "./types";

type ToasterProps = ToasterConfig;

/**
 * Toaster
 *
 * Componente que renderiza los toasts.
 * Debe estar dentro de ThemeProvider para acceder al tema ERP;
 * en rutas Ops el bridge opcional sobreescribe el look.
 */
export function Toaster({
  position = "top-right",
  duration = 4000,
  expand = true,
  closeButton = true,
  richColors = true,
}: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const opsTheme = useSyncExternalStore(
    subscribeOpsThemeBridge,
    getOpsThemeBridge,
    () => null,
  );
  const theme = opsTheme ?? resolvedTheme;
  const toasterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = toasterRef.current;
    if (!el) return;
    if (opsTheme) {
      el.classList.add("platform-ops");
      el.setAttribute("data-ops-theme", opsTheme);
    } else {
      el.classList.remove("platform-ops");
      el.removeAttribute("data-ops-theme");
    }
  }, [opsTheme]);

  const offset = opsTheme
    ? { top: 50, right: 16, left: 16, bottom: 16 }
    : { top: 80, right: 16, left: 16, bottom: 16 };
  const mobileOffset = opsTheme
    ? { top: 50, right: 12, left: 12, bottom: 12 }
    : { top: 72, right: 12, left: 12, bottom: 12 };

  return (
    <SonnerToaster
      ref={toasterRef}
      theme={theme}
      position={position}
      // ERP: header fijo h-16. Ops: topbar 42px + 8px, sin el offset de 80.
      offset={offset}
      mobileOffset={mobileOffset}
      className="z-[100]"
      visibleToasts={4}
      gap={10}
      duration={duration}
      expand={expand}
      closeButton={closeButton}
      richColors={opsTheme ? false : richColors}
      toastOptions={{
        style: {
          // Fondo sólido para evitar que el contenido de la página se mezcle
          // visualmente con el toast. Tokens OKLCH — usar var() directo.
          background: opsTheme ? "var(--ops-surface)" : "var(--card)",
          color: opsTheme ? "var(--ops-fg)" : "var(--foreground)",
          border: opsTheme
            ? "1px solid var(--ops-border)"
            : "1px solid var(--border)",
          boxShadow: opsTheme ? "none" : undefined,
          opacity: 1,
          backdropFilter: "none",
          zIndex: 100,
        },
        classNames: opsTheme
          ? {
              toast:
                "shadow-none !opacity-100 backdrop-blur-none pointer-events-auto select-text max-w-[min(100vw-2rem,28rem)]",
              description:
                "select-text whitespace-pre-wrap break-words max-h-48 overflow-y-auto",
              closeButton: "pointer-events-auto",
              title: "select-text",
            }
          : {
              toast:
                "shadow-lg !bg-card !text-foreground !opacity-100 backdrop-blur-none pointer-events-auto select-text max-w-[min(100vw-2rem,28rem)]",
              description:
                "select-text whitespace-pre-wrap break-words max-h-48 overflow-y-auto",
              closeButton: "pointer-events-auto !bg-card !border-border",
              title: "select-text",
            },
      }}
    />
  );
}
