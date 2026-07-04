/**
 * Contrato de integración Sonner ↔ overlays Radix (Sheet).
 * Sonner portalea toasts a document.body; con Sheet no-modal Radix los
 * interpreta como outside click. Usar preventDismissOnSonnerToast en
 * onPointerDownOutside / onInteractOutside de SheetContent.
 */

export const SONNER_TOASTER_SELECTOR = "[data-sonner-toaster]";
export const SONNER_TOAST_SELECTOR = "[data-sonner-toast]";

export function isSonnerToastTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return (
    target.closest(SONNER_TOASTER_SELECTOR) !== null ||
    target.closest(SONNER_TOAST_SELECTOR) !== null
  );
}

export function preventDismissOnSonnerToast(event: Event): void {
  if (isSonnerToastTarget(event.target)) {
    event.preventDefault();
  }
}
