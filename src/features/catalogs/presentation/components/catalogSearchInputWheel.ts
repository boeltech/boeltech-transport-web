/**
 * En Sheet/Dialog: la lista consume el scroll; en los extremos se evita que la rueda mueva el fondo.
 * Solo aplica preventDefault si hay overflow; con pocos ítems no hay scroll y React usa listener pasivo.
 */
export function handleCatalogResultsListWheel(
  el: HTMLElement,
  e: WheelEvent,
): void {
  e.stopPropagation();
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight + 1) {
    return;
  }
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
    e.preventDefault();
  }
}
