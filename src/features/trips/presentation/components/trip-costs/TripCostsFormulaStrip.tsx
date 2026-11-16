/**
 * Franja fórmula Operate del tab Costos (artboard Operate-Viaje-Costos).
 * Ingreso − Ruta y unidad − Operador y extras = Utilidad (margen + hint).
 */

import { cn } from "@shared/lib/utils/cn";

import { formatMxCurrency } from "../trip-financial";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

export type TripCostsFormulaStripProps = {
  income: number;
  incomeHint: string;
  operationalTotal: number;
  operationalCount: number;
  indirectTotal: number;
  indirectCount: number;
  utility: number;
  marginPct: number | null;
  /** Completado → utilidad confirmada / solo aprobados. */
  confirmed: boolean;
  className?: string;
};

export function TripCostsFormulaStrip({
  income,
  incomeHint,
  operationalTotal,
  operationalCount,
  indirectTotal,
  indirectCount,
  utility,
  marginPct,
  confirmed,
  className,
}: TripCostsFormulaStripProps) {
  const utilityLabel = confirmed
    ? copy.formula.utilityConfirmed
    : copy.formula.utilityEstimated;
  const marginHint = confirmed
    ? copy.formula.approvedOnly
    : copy.formula.includesReview;
  const marginLine =
    marginPct == null
      ? marginHint
      : copy.formula.marginLine(`${marginPct.toFixed(1)}%`, marginHint);

  return (
    <section
      className={cn(
        "grid grid-cols-1 gap-2 rounded-xl border border-border bg-card p-2 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.15fr)] sm:items-stretch",
        className,
      )}
      aria-label={copy.formula.ariaLabel}
      data-testid="trip-costs-formula-strip"
    >
      <FormulaTerm
        label={copy.formula.income}
        value={formatMxCurrency(income)}
        subtitle={incomeHint}
      />
      <FormulaOp>−</FormulaOp>
      <FormulaTerm
        label={copy.formula.operational}
        value={formatMxCurrency(operationalTotal)}
        subtitle={copy.formula.records(operationalCount)}
      />
      <FormulaOp>−</FormulaOp>
      <FormulaTerm
        label={copy.formula.indirect}
        value={formatMxCurrency(indirectTotal)}
        subtitle={copy.formula.records(indirectCount)}
      />
      <FormulaOp>=</FormulaOp>
      <FormulaTerm
        label={utilityLabel}
        value={formatMxCurrency(utility)}
        subtitle={marginLine}
        emphasize
      />
    </section>
  );
}

function FormulaTerm({
  label,
  value,
  subtitle,
  emphasize = false,
}: {
  label: string;
  value: string;
  subtitle: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-lg px-3 py-2.5",
        emphasize && "bg-success-soft text-success-soft-foreground",
      )}
    >
      <span
        className={cn(
          "text-xs font-semibold",
          emphasize ? "text-success-soft-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums tracking-tight",
          emphasize ? "text-lg" : "text-base",
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "text-xs",
          emphasize ? "text-success-soft-foreground" : "text-muted-foreground",
        )}
      >
        {subtitle}
      </span>
    </div>
  );
}

function FormulaOp({ children }: { children: string }) {
  return (
    <div
      className="hidden items-center justify-center text-xl font-medium text-muted-foreground sm:flex"
      aria-hidden
    >
      {children}
    </div>
  );
}
