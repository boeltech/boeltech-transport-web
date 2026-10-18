import type { ToastVariant } from "@/shared/ui/toast/types";

/** Umbral único (D3): mensajes más largos van inline (Alert), no dump en toast. */
export const OVERLAY_ERROR_INLINE_THRESHOLD = 160;

/** Duraciones canónicas (D2). */
export const TOAST_DURATION_DEFAULT_MS = 4_000;
export const TOAST_DURATION_ERROR_SHORT_MS = 6_000;
export const TOAST_DURATION_ERROR_LONG_MS = 8_000;
export const TOAST_DURATION_ERROR_VERY_LONG_MS = 12_000;

export function isInlineOverlayError(message: string): boolean {
  return message.length > OVERLAY_ERROR_INLINE_THRESHOLD;
}

export function buildOverlayErrorToastDescription(
  message: string,
  seeInlineCopy: string,
): string {
  return isInlineOverlayError(message) ? seeInlineCopy : message;
}

/**
 * Agrupa N warnings en una sola description (D6).
 * Una sola línea si hay un mensaje; lista numerada si hay varios.
 */
export function formatGroupedWarningDescription(messages: string[]): string {
  const cleaned = messages.map((m) => m.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0]!;
  return cleaned.map((m, i) => `${i + 1}. ${m}`).join("\n");
}

/**
 * Duración unificada para `toast()` y helpers `toastError` / `error()` (D2).
 * Para errores, mide `description` o, si falta, `title` (p. ej. `toastError(msgLargo)`).
 */
export function resolveToastDuration(
  variant: ToastVariant,
  description: string | undefined,
  explicit?: number,
  title?: string,
): number {
  if (explicit !== undefined) {
    return explicit;
  }

  if (variant === "error" || variant === "destructive") {
    const len = (description ?? title ?? "").length;
    if (len > OVERLAY_ERROR_INLINE_THRESHOLD * 2) {
      return TOAST_DURATION_ERROR_VERY_LONG_MS;
    }
    if (len > OVERLAY_ERROR_INLINE_THRESHOLD) {
      return TOAST_DURATION_ERROR_LONG_MS;
    }
    return TOAST_DURATION_ERROR_SHORT_MS;
  }

  return TOAST_DURATION_DEFAULT_MS;
}
