import { useLocation } from "react-router-dom";

/** URL de un listado, incluida la query actual (filtros, sort, página). */
export function buildListHref(
  basePath: string,
  searchParams: URLSearchParams,
): string {
  const qs = searchParams.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** `location.state.from` = cola actual (pathname + query). */
export function useListQueueFromState(): { from: string } {
  const { pathname, search } = useLocation();
  return { from: `${pathname}${search}` };
}

export function useIncomingFrom(): string | undefined {
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.trim() !== "" ? from : undefined;
}
