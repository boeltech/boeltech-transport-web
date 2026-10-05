import type { HelpSpotlightUnavailableReason } from "../../domain/helpEvents";

export type FindHelpAnchorResult =
  | { ok: true; element: HTMLElement }
  | { ok: false; reason: Exclude<HelpSpotlightUnavailableReason, "wrong_screen"> };

/**
 * Locates the first visible `[data-help-anchor="…"]` in document order (TEC §3.1).
 */
export function findHelpAnchorElement(anchorId: string): FindHelpAnchorResult {
  // anchorId is kebab-case ([a-z0-9-]+); no need for CSS.escape.
  const matches = document.querySelectorAll<HTMLElement>(
    `[data-help-anchor="${anchorId}"]`,
  );

  if (matches.length === 0) {
    return { ok: false, reason: "not_in_dom" };
  }

  for (const el of Array.from(matches)) {
    if (isElementVisible(el)) {
      return { ok: true, element: el };
    }
  }

  return { ok: false, reason: "not_visible" };
}

export function isElementVisible(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === "function") {
    try {
      return el.checkVisibility({
        checkOpacity: true,
        checkVisibilityCSS: true,
      });
    } catch {
      // older browsers / incomplete options
    }
  }

  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  const rects = el.getClientRects();
  return rects.length > 0;
}
