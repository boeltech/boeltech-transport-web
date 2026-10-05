/**
 * Tucks the help Sheet + its full-screen backdrop so the spotlight target
 * is not covered (PRD D-A1.4 / TEC OA-3).
 */

const PANEL_SEL = "[data-help-panel]";
const BACKDROP_SEL = "[data-sheet-backdrop]";

function findBackdrop(panel: HTMLElement | null): HTMLElement | null {
  const marked = document.querySelector<HTMLElement>(BACKDROP_SEL);
  if (marked) return marked;
  // Sheet portal: Backdrop is the previous sibling of SheetContent.
  const prev = panel?.previousElementSibling;
  return prev instanceof HTMLElement ? prev : null;
}

export function setHelpSpotlightChrome(active: boolean): void {
  const panel = document.querySelector<HTMLElement>(PANEL_SEL);
  const backdrop = findBackdrop(panel);

  if (active) {
    document.documentElement.setAttribute("data-help-spotlight-active", "");
    panel?.setAttribute("data-help-spotlight", "");
    backdrop?.setAttribute("data-help-spotlight-backdrop", "");
    if (backdrop && !backdrop.hasAttribute("data-sheet-backdrop")) {
      backdrop.setAttribute("data-sheet-backdrop", "");
    }
  } else {
    document.documentElement.removeAttribute("data-help-spotlight-active");
    panel?.removeAttribute("data-help-spotlight");
    backdrop?.removeAttribute("data-help-spotlight-backdrop");
  }
}

/** Wait for layout/paint after chrome tuck (CSS transform). */
export function waitForSpotlightChrome(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
