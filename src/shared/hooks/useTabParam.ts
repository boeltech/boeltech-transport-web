/**
 * useTabParam
 *
 * Controla los tabs de una pantalla desde la URL (`?tab=`), de forma que un
 * tab sea enlazable, sobreviva a un refresh y se pueda alcanzar por deep-link.
 * El tab por defecto no escribe el parámetro (URL limpia).
 *
 * Cambiar de tab usa `replace`: el botón atrás del navegador sale de la
 * pantalla en lugar de recorrer los tabs visitados.
 *
 * Ubicación: src/shared/hooks/useTabParam.ts
 */

import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export interface UseTabParamResult<TTab extends string> {
  /** Tab activo resuelto desde la URL (o el default si el valor no es válido). */
  activeTab: TTab;
  /** Handler para `onValueChange` de los tabs. */
  setActiveTab: (value: string) => void;
}

export function useTabParam<TTab extends string>(
  tabs: readonly TTab[],
  defaultTab: TTab,
  paramName = "tab",
): UseTabParamResult<TTab> {
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get(paramName);
  const activeTab = tabs.includes(requested as TTab)
    ? (requested as TTab)
    : defaultTab;

  const setActiveTab = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === defaultTab) {
            next.delete(paramName);
          } else {
            next.set(paramName, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [defaultTab, paramName, setSearchParams],
  );

  return { activeTab, setActiveTab };
}
