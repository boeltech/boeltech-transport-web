/**
 * ToastProvider
 *
 * Provider que configura el sistema de notificaciones toast.
 * Solo renderiza el Toaster con la configuración apropiada.
 *
 * La lógica de mostrar toasts está en el hook useToast.
 *
 * Ubicación: src/app/providers/ToastProvider.tsx
 *
 * @example
 * // En App.tsx o providers
 * <ThemeProvider>
 *   <ToastProvider position="top-right">
 *     {children}
 *   </ToastProvider>
 * </ThemeProvider>
 */

import type { ReactNode } from "react";
import { Toaster } from "@/shared/ui/toast";
import type { ToasterConfig } from "@/shared/ui/toast";

interface ToastProviderProps extends ToasterConfig {
  children: ReactNode;
}

export function ToastProvider({
  children,
  position = "top-right",
  duration = 4000,
  expand = true,
  closeButton = true,
  richColors = true,
}: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position={position}
        duration={duration}
        expand={expand}
        closeButton={closeButton}
        richColors={richColors}
      />
    </>
  );
}
