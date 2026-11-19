import { useLocation } from "react-router-dom";

/** State de wayfinding al navegar a un detalle (Q1 / NL3). */
export type WayfindingLocationState = {
  from: string;
  fromLabel?: string;
};

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

function readWayfindingState(
  state: unknown,
): WayfindingLocationState | undefined {
  if (state == null || typeof state !== "object") return undefined;
  const from = (state as { from?: unknown }).from;
  if (typeof from !== "string" || from.trim() === "") return undefined;
  const fromLabelRaw = (state as { fromLabel?: unknown }).fromLabel;
  const fromLabel =
    typeof fromLabelRaw === "string" && fromLabelRaw.trim() !== ""
      ? fromLabelRaw
      : undefined;
  return fromLabel ? { from, fromLabel } : { from };
}

export function useIncomingFrom(): string | undefined {
  const location = useLocation();
  return readWayfindingState(location.state)?.from;
}

/** Identidad del origen (`TRP-…`, nombre) cuando se navega detalle → detalle. */
export function useIncomingFromLabel(): string | undefined {
  const location = useLocation();
  return readWayfindingState(location.state)?.fromLabel;
}

/** Lectura tipada del state de wayfinding (`from` + `fromLabel?`). */
export function useIncomingWayfinding(): WayfindingLocationState | undefined {
  const location = useLocation();
  return readWayfindingState(location.state);
}
