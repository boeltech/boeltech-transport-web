import { useEffect, useState } from "react";
import type { SetURLSearchParams } from "react-router-dom";
import { useDebounce } from "./use-debounce";

interface UseDebouncedSearchParamOptions {
  paramName?: string;
  delayMs?: number;
  resetPageParamName?: string;
}

/**
 * Sincroniza un input de búsqueda con URLSearchParams usando debounce.
 * Reutilizable para listados en cualquier módulo.
 */
export function useDebouncedSearchParam(
  currentSearchValue: string,
  setSearchParams: SetURLSearchParams,
  options: UseDebouncedSearchParamOptions = {},
) {
  const {
    paramName = "search",
    delayMs = 300,
    resetPageParamName = "page",
  } = options;

  const [searchInput, setSearchInput] = useState(currentSearchValue);
  const debouncedSearch = useDebounce(searchInput, delayMs);

  useEffect(() => {
    setSearchInput(currentSearchValue);
  }, [currentSearchValue]);

  useEffect(() => {
    if (debouncedSearch === currentSearchValue) return;

    // Tras limpiar filtros desde la URL, el debounce puede ir retrasado ~300ms
    // y volvería a escribir el término anterior en searchParams.
    if (currentSearchValue === "" && searchInput === "") return;

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (debouncedSearch.trim()) params.set(paramName, debouncedSearch.trim());
        else params.delete(paramName);
        params.set(resetPageParamName, "1");
        return params;
      },
      { replace: true },
    );
  }, [
    currentSearchValue,
    debouncedSearch,
    searchInput,
    paramName,
    resetPageParamName,
    setSearchParams,
  ]);

  return {
    searchInput,
    setSearchInput,
  };
}
