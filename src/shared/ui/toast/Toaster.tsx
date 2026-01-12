"use client";

import { useToast } from "@app/providers/ToastProvider";
import {
  ToastRadixProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "./Toast";

/**
 * Toaster
 *
 * Componente que renderiza todos los toasts activos.
 * Debe colocarse una sola vez en la app, típicamente en el layout principal.
 *
 * @example
 * // En AppLayout.tsx o similar
 * <ToastProvider>
 *   {children}
 *   <Toaster />
 * </ToastProvider>
 */
export const Toaster = () => {
  const { toasts, dismiss } = useToast();

  return (
    <ToastRadixProvider>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          open={true}
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
        >
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && (
              <ToastDescription>{t.description}</ToastDescription>
            )}
          </div>

          {t.action && (
            <ToastAction altText={t.action.label} onClick={t.action.onClick}>
              {t.action.label}
            </ToastAction>
          )}

          {t.dismissible && <ToastClose />}
        </Toast>
      ))}

      <ToastViewport />
    </ToastRadixProvider>
  );
};
