/**
 * URL del workbench de viajes, incluida la query actual (bucket, filtros).
 * Se guarda en `location.state.from` para restaurar la cola al volver.
 */
export function tripsListHref(searchParams: URLSearchParams): string {
  const qs = searchParams.toString();
  return qs ? `/trips?${qs}` : "/trips";
}
