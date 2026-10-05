import type { HelpProductEvent, HelpSearchSurface } from "../domain/helpEvents";
import { helpCenterApi } from "../infrastructure";
import {
  hashSearchQuery,
  searchQueryLen,
} from "../infrastructure/hashSearchQuery";

/**
 * Fire-and-forget: fallos de red no bloquean UX (TEC §5.3).
 */
export function trackHelpEvent(event: HelpProductEvent): void {
  void helpCenterApi.postHelpEvent(event).catch(() => {
    // intentional swallow
  });
}

/** Emite `help_search_performed` si q≥2 tras debounce del caller. */
export function trackHelpSearchPerformed(
  q: string,
  surface: HelpSearchSurface,
  route?: string,
): void {
  const trimmed = q.trim();
  if (trimmed.length < 2) return;

  void (async () => {
    const qHash = await hashSearchQuery(trimmed);
    trackHelpEvent({
      eventName: "help_search_performed",
      route,
      payload: {
        qHash,
        qLen: searchQueryLen(trimmed),
        surface,
      },
    });
  })();
}
