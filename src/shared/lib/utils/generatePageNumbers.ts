/**
 * generatePageNumbers
 * Clean Architecture - Presentation Layer (Utils)
 *
 * Genera los números de página para mostrar en la paginación.
 * Incluye elipsis (...) cuando hay muchas páginas.
 *
 * Ubicación: src/features/{feature}/presentation/utils/generatePageNumbers.ts
 * O compartido en: src/shared/lib/utils/generatePageNumbers.ts
 */

type PageItem = number | "...";

/**
 * Genera un array de números de página y elipsis para mostrar en el paginador.
 *
 * Ejemplos:
 * - currentPage: 1, totalPages: 5  → [1, 2, 3, 4, 5]
 * - currentPage: 1, totalPages: 10 → [1, 2, 3, "...", 10]
 * - currentPage: 5, totalPages: 10 → [1, "...", 4, 5, 6, "...", 10]
 * - currentPage: 10, totalPages: 10 → [1, "...", 8, 9, 10]
 *
 * @param currentPage - Página actual (1-indexed)
 * @param totalPages - Total de páginas
 * @returns Array de números de página y elipsis
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  // Si hay pocas páginas, mostrar todas
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageItem[] = [];

  // Siempre mostrar primera página
  pages.push(1);

  // Calcular rango alrededor de la página actual
  const leftSibling = Math.max(2, currentPage - 1);
  const rightSibling = Math.min(totalPages - 1, currentPage + 1);

  // Agregar elipsis izquierda si es necesario
  const showLeftEllipsis = leftSibling > 2;
  if (showLeftEllipsis) {
    pages.push("...");
  }

  // Agregar páginas del rango
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== totalPages) {
      pages.push(i);
    }
  }

  // Agregar elipsis derecha si es necesario
  const showRightEllipsis = rightSibling < totalPages - 1;
  if (showRightEllipsis) {
    pages.push("...");
  }

  // Siempre mostrar última página
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
