/**
 * Toast UI Module
 *
 * Exporta componentes UI relacionados con toasts.
 * Ubicación: src/shared/ui/toast/index.ts
 */

export { Toaster } from "./Toaster";
export {
  isSonnerToastTarget,
  preventDismissOnSonnerToast,
  SONNER_TOAST_SELECTOR,
  SONNER_TOASTER_SELECTOR,
} from "./sonnerDismissGuard";
export type {
  ToastVariant,
  ToastPosition,
  ToastOptions,
  ToastPromiseMessages,
  ToasterConfig,
} from "./types";
