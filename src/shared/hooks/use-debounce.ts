import { useState, useEffect } from "react";

/**
 * Hook para retrasar la actualización de un valor hasta que el usuario
 * deje de escribir por un período determinado.
 *
 * @param value - Valor a debounce
 * @param delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns El valor debounced
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 300);
 */
export const useDebounce = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
