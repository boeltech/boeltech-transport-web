import { Calculator } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Separator } from "@shared/ui/separator";
import { cn } from "@shared/lib/utils/cn";

import { formatMxCurrency } from "./financialSummary";
import type { TripWizardExpenseLine, TripWizardFinancialSnapshot } from "./tripWizardFinancialSnapshot";
import { wizardCopy } from "../../copy";

const defaultCopy = wizardCopy.costs.financialSummary;

/** Subconjunto de labels usados por el resumen (wizard o detalle). */
export type TripFinancialSummaryCopy = {
  section: {
    title: string;
    income: string;
    operational: (count: number) => string;
    indirect: (count: number) => string;
  };
  label: {
    freight: string;
    baseRate: string;
    income: string;
    costs: string;
    expenses: string;
    margin: string;
    marginPct: string;
  };
  state: {
    emptyLines: string;
  };
};

export interface TripWizardFinancialSummaryProps {
  snapshot: TripWizardFinancialSnapshot;
  className?: string;
  /** Envuelve en Card con encabezado (panel sticky del paso Dinero del viaje). */
  showCard?: boolean;
  /**
   * `lines` (default): lista cada concepto — resumen del wizard.
   * `totals`: solo totales y margen — paso Dinero del viaje y detalle viaje.
   */
  variant?: "lines" | "totals";
  /** Override del título del card (detalle viaje). */
  title?: string;
  /** Chip de origen del ingreso (Facturado / Tarifa). */
  incomeSourceLabel?: string | null;
  /** Microcopy bajo el margen (p. ej. monto en revisión). */
  queuedCostsHint?: string | null;
  /** Estado del cálculo (estimado vs solo aprobados). */
  calculationStatusHint?: string | null;
  /** Etiqueta del margen primario (p. ej. Utilidad confirmada). */
  marginLabel?: string;
  /** Copy del resumen; por defecto wizard. Detalle pasa tripDetailCopy.costs.financialSummary. */
  summaryCopy?: TripFinancialSummaryCopy;
}

function TripWizardFinancialSummaryBody({
  snapshot,
  variant,
  incomeSourceLabel,
  queuedCostsHint,
  calculationStatusHint,
  marginLabel,
  copy,
}: {
  snapshot: TripWizardFinancialSnapshot;
  variant: "lines" | "totals";
  incomeSourceLabel?: string | null;
  queuedCostsHint?: string | null;
  calculationStatusHint?: string | null;
  marginLabel?: string;
  copy: TripFinancialSummaryCopy;
}) {
  const { operationalCosts, indirectExpenses, financial, marginToneClass } =
    snapshot;
  const resolvedMarginLabel = marginLabel ?? copy.label.margin;

  const statusBlock =
    calculationStatusHint || queuedCostsHint ? (
      <div className="space-y-1">
        {calculationStatusHint ? (
          <p className="text-xs text-muted-foreground">{calculationStatusHint}</p>
        ) : null}
        {queuedCostsHint ? (
          <p className="text-xs text-warning-foreground">{queuedCostsHint}</p>
        ) : null}
      </div>
    ) : null;

  if (variant === "totals") {
    return (
      <div className="space-y-3">
        <InfoRow
          variant="inline"
          label={copy.label.income}
          value={
            <span className="inline-flex flex-wrap items-center justify-end gap-2">
              {incomeSourceLabel ? (
                <Badge variant="neutral" tone="soft" className="text-xs">
                  {incomeSourceLabel}
                </Badge>
              ) : null}
              <span>{formatMxCurrency(financial.baseRate)}</span>
            </span>
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.costs}
          value={`−${formatMxCurrency(financial.totalOperationalCosts)}`}
        />
        <InfoRow
          variant="inline"
          label={copy.label.expenses}
          value={`−${formatMxCurrency(financial.totalIndirectExpenses)}`}
        />
        <Separator />
        <InfoRow
          variant="inline"
          label={resolvedMarginLabel}
          value={
            <span className={cn("font-semibold", marginToneClass)}>
              {formatMxCurrency(financial.margin)}
            </span>
          }
        />
        <InfoRow
          variant="inline"
          label={copy.label.marginPct}
          value={
            financial.marginPct === null
              ? "—"
              : `${financial.marginPct.toFixed(1)} %`
          }
        />
        {statusBlock}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-success/30 bg-success-soft/70">
        <div className="border-b border-success/30 px-3 py-2 text-xs font-semibold text-success-soft-foreground">
          <span className="inline-flex flex-wrap items-center gap-2">
            {copy.section.income}
            {incomeSourceLabel ? (
              <Badge variant="neutral" tone="soft" className="text-xs font-medium">
                {incomeSourceLabel}
              </Badge>
            ) : null}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{copy.label.freight}</p>
            <p className="text-xs text-muted-foreground">{copy.label.baseRate}</p>
          </div>
          <span className="font-semibold text-success-soft-foreground">
            +{formatMxCurrency(financial.baseRate)}
          </span>
        </div>
      </div>

      <div className="rounded-md border border-info/30 bg-info-soft/70">
        <div className="border-b border-info/30 px-3 py-2 text-xs font-semibold text-info-soft-foreground">
          {copy.section.operational(operationalCosts.length)}
        </div>
        <div className="space-y-2 px-3 py-2">
          {operationalCosts.length === 0 ? (
            <p className="text-xs text-muted-foreground">{copy.state.emptyLines}</p>
          ) : (
            operationalCosts.map((item, index) => (
              <div
                key={item.id ?? `op-${index}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <p className="truncate">{item.description}</p>
                <span className="shrink-0 font-semibold text-info-soft-foreground">
                  -{formatMxCurrency(item.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-md border border-warning/30 bg-warning-soft/70">
        <div className="border-b border-warning/30 px-3 py-2 text-xs font-semibold text-warning-soft-foreground">
          {copy.section.indirect(indirectExpenses.length)}
        </div>
        <div className="space-y-2 px-3 py-2">
          {indirectExpenses.length === 0 ? (
            <p className="text-xs text-muted-foreground">{copy.state.emptyLines}</p>
          ) : (
            indirectExpenses.map((item, index) => (
              <div
                key={item.id ?? `ind-${index}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <p className="truncate">{item.description}</p>
                <span className="shrink-0 font-semibold text-warning-soft-foreground">
                  -{formatMxCurrency(item.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <Separator />
      <InfoRow
        variant="inline"
        label={copy.label.income}
        value={formatMxCurrency(financial.baseRate)}
      />
      <InfoRow
        variant="inline"
        label={copy.label.costs}
        value={`-${formatMxCurrency(financial.totalOperationalCosts)}`}
      />
      <InfoRow
        variant="inline"
        label={copy.label.expenses}
        value={`-${formatMxCurrency(financial.totalIndirectExpenses)}`}
      />
      <Separator />
      <InfoRow
        variant="inline"
        label={resolvedMarginLabel}
        value={
          <span className={cn("font-semibold", marginToneClass)}>
            {formatMxCurrency(financial.margin)}
          </span>
        }
      />
      <InfoRow
        variant="inline"
        label={copy.label.marginPct}
        value={
          financial.marginPct === null
            ? "—"
            : `${financial.marginPct.toFixed(1)}%`
        }
      />
      {statusBlock}
    </div>
  );
}

export function TripWizardFinancialSummary({
  snapshot,
  className,
  showCard = true,
  variant = "lines",
  title,
  incomeSourceLabel,
  queuedCostsHint,
  calculationStatusHint,
  marginLabel,
  summaryCopy,
}: TripWizardFinancialSummaryProps) {
  const copy = summaryCopy ?? defaultCopy;

  if (!showCard) {
    return (
      <div className={className}>
        <TripWizardFinancialSummaryBody
          snapshot={snapshot}
          variant={variant}
          incomeSourceLabel={incomeSourceLabel}
          queuedCostsHint={queuedCostsHint}
          calculationStatusHint={calculationStatusHint}
          marginLabel={marginLabel}
          copy={copy}
        />
      </div>
    );
  }

  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" />
          {title ?? copy.section.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TripWizardFinancialSummaryBody
          snapshot={snapshot}
          variant={variant}
          incomeSourceLabel={incomeSourceLabel}
          queuedCostsHint={queuedCostsHint}
          calculationStatusHint={calculationStatusHint}
          marginLabel={marginLabel}
          copy={copy}
        />
      </CardContent>
    </Card>
  );
}

export type { TripWizardExpenseLine };
