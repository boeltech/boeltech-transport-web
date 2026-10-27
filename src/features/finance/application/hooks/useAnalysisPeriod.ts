import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getTodayString } from "@shared/utils/dateUtils";
import { resolveAnalysisPeriod, type ResolvedAnalysisPeriod } from "../analysisPeriod";
import type { FinanceDateRange } from "../expensePeriod";

export interface UseAnalysisPeriodResult {
  period: ResolvedAnalysisPeriod;
  today: string;
  /** Escribe `from`/`to` en la URL (vacíos = periodo por defecto). */
  setRange: (range: FinanceDateRange) => void;
}

/** Periodo único del hub Análisis (`from`/`to` en la URL), leído por las tres vistas. */
export function useAnalysisPeriod(): UseAnalysisPeriodResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const [today] = useState(getTodayString);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const period = useMemo(
    () => resolveAnalysisPeriod({ from, to }, today),
    [from, to, today],
  );

  const setRange = useCallback(
    (range: FinanceDateRange) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (range.from) params.set("from", range.from);
        else params.delete("from");
        if (range.to) params.set("to", range.to);
        else params.delete("to");
        return params;
      });
    },
    [setSearchParams],
  );

  return { period, today, setRange };
}
