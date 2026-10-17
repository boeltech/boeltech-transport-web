/**
 * Instrumentación cliente de activación (F4).
 * Fire-and-forget: console.debug en DEV + Sentry breadcrumb si Sentry está init.
 * No envía a help-center ni a API nueva.
 */

import * as Sentry from "@sentry/react";

import { isSentryEnabled } from "@shared/observability/sentry";

export type ActivationEventName =
  | "activation_checklist_viewed"
  | "activation_first_trip_ready"
  | "activation_demo_seed_loaded"
  | "activation_demo_seed_purged"
  | "activation_checklist_dismissed";

export type ActivationEventPayload = Record<string, unknown>;

const firedOnce = new Set<string>();

/**
 * Emite un evento de activación sin bloquear la UI.
 * Con `onceKey`, no reemite el mismo evento+clave en la sesión SPA.
 */
export function trackActivationEvent(
  event: ActivationEventName,
  payload?: ActivationEventPayload,
  options?: { onceKey?: string },
): void {
  if (options?.onceKey) {
    const dedupeKey = `${event}:${options.onceKey}`;
    if (firedOnce.has(dedupeKey)) return;
    firedOnce.add(dedupeKey);
  }

  try {
    const data = payload ?? {};
    if (import.meta.env.DEV) {
      console.debug("[activation]", event, data);
    }
    if (isSentryEnabled()) {
      Sentry.addBreadcrumb({
        category: "activation",
        message: event,
        level: "info",
        data,
      });
    }
  } catch {
    // never throw from analytics
  }
}

/** Solo tests — limpia la dedupe de sesión. */
export function resetActivationEventOnceKeysForTests(): void {
  firedOnce.clear();
}
