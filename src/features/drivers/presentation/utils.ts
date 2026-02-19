/**
 * Pagination Utilities
 * Clean Architecture - Presentation Layer
 *
 * Utilidades para manejar paginación en componentes.
 */

// ============================================================================
// GENERATE PAGE NUMBERS
// ============================================================================

/**
 * Genera números de página para mostrar en la UI
 *
 * @param currentPage - Página actual
 * @param totalPages - Total de páginas
 * @param maxVisible - Máximo de números visibles (default: 5)
 * @returns Array de números de página o "..." para ellipsis
 *
 * @example
 * generatePageNumbers(5, 10) // [1, "...", 4, 5, 6, "...", 10]
 * generatePageNumbers(1, 5)  // [1, 2, 3, 4, 5]
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Siempre mostrar primera página
  pages.push(1);

  // Calcular rango alrededor de la página actual
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  // Ajustar si estamos cerca del inicio
  if (currentPage <= halfVisible + 1) {
    end = Math.min(totalPages - 1, maxVisible - 1);
  }

  // Ajustar si estamos cerca del final
  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 2);
  }

  // Añadir ellipsis antes si es necesario
  if (start > 2) {
    pages.push("...");
  }

  // Añadir páginas intermedias
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Añadir ellipsis después si es necesario
  if (end < totalPages - 1) {
    pages.push("...");
  }

  // Siempre mostrar última página
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
