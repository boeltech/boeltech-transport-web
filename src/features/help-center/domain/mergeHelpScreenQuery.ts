/**
 * Fuse pathname + location search with opaque extras (e.g. synthetic `status=`).
 * Extras win on the same key. Does not import product features (ADR-0102).
 */
export function mergeHelpScreenQuery(
  pathname: string,
  search: string,
  extras: Record<string, string> | null | undefined,
): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}
