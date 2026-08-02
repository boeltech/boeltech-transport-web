import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { searchAddresses } from "./addressSearchApi";
import {
  addressSearchQueryKeys,
  type AddressSearchPage,
  type AddressSearchParams,
} from "./types";

/** Longitud mínima para filtrar en servidor (API ignora `q` más corto). */
const MIN_FILTER_QUERY_LENGTH = 2;

/**
 * True cuando `q` aplica filtro ILIKE en el API.
 * Cadena vacía o 1 carácter → listado browse (todas las direcciones del scope).
 */
export function isAddressSearchFilterActive(q: string | undefined): boolean {
  return (q?.trim().length ?? 0) >= MIN_FILTER_QUERY_LENGTH;
}

/**
 * @deprecated Prefer `isAddressSearchFilterActive`. El picker ya hace browse al abrir;
 * esta función queda como alias de “¿hay filtro de texto activo?”.
 */
export function isAddressSearchQueryReady(q: string | undefined): boolean {
  return isAddressSearchFilterActive(q);
}

/** Normaliza params: solo envía `q` cuando el API lo usará como filtro. */
export function normalizeAddressSearchParams(
  params: AddressSearchParams,
): AddressSearchParams {
  const q = params.q?.trim();
  return {
    ...params,
    q: q && isAddressSearchFilterActive(q) ? q : undefined,
  };
}

export interface UseAddressSearchOptions
  extends Omit<
    UseQueryOptions<AddressSearchPage, Error>,
    "queryKey" | "queryFn"
  > {
  params: AddressSearchParams;
  /** When false, skips the fetch (e.g. popover closed). */
  enabled?: boolean;
}

/**
 * Búsqueda / listado de direcciones (ADR-0053).
 * Con `q` vacío o corto: browse (todas las del scope, paginadas).
 * Con `q` de 2+ caracteres: filtro servidor.
 */
export function useAddressSearch({
  params,
  enabled = true,
  staleTime = 30_000,
  ...options
}: UseAddressSearchOptions) {
  const normalized = normalizeAddressSearchParams(params);

  return useQuery({
    queryKey: addressSearchQueryKeys.search(normalized),
    queryFn: () => searchAddresses(normalized),
    enabled,
    staleTime,
    placeholderData: keepPreviousData,
    ...options,
  });
}
