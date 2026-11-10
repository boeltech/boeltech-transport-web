import { CalendarDays } from "lucide-react";
import { Button } from "@shared/ui/button";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.closedPeriod;

export interface ClosedPeriodBannerModel {
  /** Etiqueta corta del calendario (p. ej. «NOV»). */
  monthLabel: string;
  /** Rango compacto (p. ej. «2–8»). */
  dayRange: string;
  /** Número de semana ISO o etiqueta del periodo. */
  weekLabel: string;
  operatorCount: number;
  estimatedAmount: number;
  warningsCount?: number;
  /** Operadores por armar de periodos distintos al anunciado. */
  otherPeriodsCount?: number;
  periodStart: string;
  periodEnd: string;
  /** Si false, copy genérico sin número de semana (D4). */
  namedWeek: boolean;
}

interface SettlementClosedPeriodBannerProps {
  model: ClosedPeriodBannerModel;
  onArmCut: () => void;
  canArmCut: boolean;
  armCutDisabledReason?: string;
}

/**
 * Aviso periodo cerrado (pieza #10 · CA F4.2 · remediación C7).
 * Primary soft + CTA «Armar corte de la semana N».
 */
export function SettlementClosedPeriodBanner({
  model,
  onArmCut,
  canArmCut,
  armCutDisabledReason,
}: SettlementClosedPeriodBannerProps) {
  const title = model.namedWeek
    ? copy.title(model.weekLabel, model.operatorCount)
    : copy.titleGeneric(model.operatorCount);
  const cta = model.namedWeek
    ? copy.cta(model.weekLabel)
    : copy.ctaGeneric;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4"
      data-testid="settlement-closed-period-banner"
      role="status"
    >
      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[10px] border border-primary/30 bg-card text-[10px] font-bold leading-3 text-primary">
        <span>{model.monthLabel}</span>
        <span className="text-[15px] text-foreground">{model.dayRange}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        {model.otherPeriodsCount != null && model.otherPeriodsCount > 0 ? (
          <p className="text-sm text-muted-foreground">
            {copy.otherPeriods(model.otherPeriodsCount)}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {copy.estimate(formatMxCurrency(model.estimatedAmount))}
          {model.warningsCount != null && model.warningsCount > 0
            ? ` · ${copy.warnings(model.warningsCount)}`
            : ""}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-2"
        onClick={onArmCut}
        disabled={!canArmCut}
        title={!canArmCut ? armCutDisabledReason : undefined}
      >
        <CalendarDays className="h-4 w-4" aria-hidden />
        {cta}
      </Button>
    </div>
  );
}
