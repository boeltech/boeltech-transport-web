/**
 * TrailerCatalogSheet params — deep-link de alta/edición sobre el listado.
 * `create=true` abre alta. `edit=<trailerId>` abre edición.
 */

export const TRAILER_CATALOG_CREATE_PARAM = "create";
export const TRAILER_CATALOG_EDIT_PARAM = "edit";

export function trailerCatalogListHref(options?: {
  create?: boolean;
  editId?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.create) params.set(TRAILER_CATALOG_CREATE_PARAM, "true");
  if (options?.editId) params.set(TRAILER_CATALOG_EDIT_PARAM, options.editId);
  const query = params.toString();
  return query ? `/trailers?${query}` : "/trailers";
}

/** `edit=true` era el deep-link del detalle; ya no identifica un remolque. */
export function readTrailerCatalogEditId(value: string | null): string {
  if (!value || value === "true") return "";
  return value;
}
