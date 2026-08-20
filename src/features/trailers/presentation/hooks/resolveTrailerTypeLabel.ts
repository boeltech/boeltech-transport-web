import type { CatalogOption } from "@features/catalogs";

/**
 * Resuelve código de catálogo → nombre operativo.
 * Nunca expone el código (Capa 1 D1 / D2).
 */
export function resolveTrailerTypeLabel(
  options: readonly CatalogOption[] | undefined,
  code: string | null | undefined,
): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  const match = options?.find((option) => option.code === trimmed);
  const name = match?.name?.trim();
  return name ? name : null;
}
