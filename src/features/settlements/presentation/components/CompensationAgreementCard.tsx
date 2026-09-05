/**
 * CompensationAgreementCard & Skeleton
 * Clean Architecture - Presentation Layer (Components)
 *
 * Vista tipo tarjeta para esquemas tarifarios de choferes.
 * Ubicación: src/features/settlements/presentation/components/CompensationAgreementCard.tsx
 */

import { Calendar, Tag, Route } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { CompensationAgreement } from "../../domain/entities";
import {
  COMPENSATION_CALCULATION_TYPE_LABELS,
  COMPENSATION_SALARY_PERIOD_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  type CompensationCalculationType,
  type CompensationSalaryPeriod,
} from "../../domain/enums";
import { CompensationAgreementActions } from "./CompensationAgreementActions";
import { settlementsCopy } from "../copy/settlementsCopy";
import { getAgreementIdsWithOverlapConflict } from "../utils/compensationAgreementOverlap";

const copy = settlementsCopy;

interface CompensationAgreementCardProps {
  agreement: CompensationAgreement;
  allAgreements?: readonly CompensationAgreement[];
}

export function CompensationAgreementCard({
  agreement,
  allAgreements,
}: CompensationAgreementCardProps) {
  const isComposite = agreement.hasFixedSalary || (agreement.rules && agreement.rules.length > 0);
  const hasOverlapConflict = useMemo(() => {
    const source = allAgreements ?? [agreement];
    return getAgreementIdsWithOverlapConflict(source).has(agreement.id);
  }, [agreement, allAgreements]);

  const typeLabel = isComposite
    ? "Esquema Compuesto (Sueldo + Comisiones)"
    : COMPENSATION_CALCULATION_TYPE_LABELS[
        agreement.calculationType as CompensationCalculationType
      ] ?? agreement.calculationType;

  return (
    <Card className="shadow-sm hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {agreement.employeeFullName ?? "—"}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Tag className="h-3 w-3" />
            <span>{typeLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={agreement.isActive ? "success" : "neutral"} tone="soft">
            {agreement.isActive ? copy.fields.activeStatus : copy.fields.inactiveStatus}
          </Badge>
          {hasOverlapConflict && (
            <Badge variant="warning" tone="soft">
              {copy.fields.overlapConflictStatus}
            </Badge>
          )}
          <CompensationAgreementActions agreement={agreement} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-xs">
        {isComposite ? (
          <div className="space-y-2">
            {agreement.hasFixedSalary && (agreement.fixedSalaryAmount ?? 0) > 0 && (
              <div className="rounded-md bg-muted/50 p-2 flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Sueldo Base:</span>
                <span className="font-bold text-sm text-primary tabular-nums">
                  {formatMxCurrency(agreement.fixedSalaryAmount ?? 0)}{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    / {COMPENSATION_SALARY_PERIOD_LABELS[agreement.fixedSalaryPeriod as CompensationSalaryPeriod] ?? "semana"}
                  </span>
                </span>
              </div>
            )}

            {agreement.rules && agreement.rules.length > 0 && (
              <div className="rounded-md border p-2 space-y-1 bg-card">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1">
                  <Route className="h-3 w-3" />
                  <span>Reglas por tipo de ruta:</span>
                </div>
                {agreement.rules.map((r, idx) => {
                  const routeLabel = TRIP_ROUTE_TYPE_LABELS[r.routeType] ?? r.routeType;
                  let valDesc = "Sin comisión";
                  if (r.commissionType === "rate_per_km") {
                    valDesc = `${formatMxCurrency(r.rateValue)} / km`;
                  } else if (r.commissionType === "percentage_of_freight") {
                    valDesc = `${r.rateValue}% flete`;
                  } else if (r.commissionType === "fixed_per_trip") {
                    valDesc = `${formatMxCurrency(r.rateValue)} / viaje`;
                  }

                  return (
                    <div key={r.id ?? idx} className="flex justify-between items-center text-[11px]">
                      <span className="text-foreground font-medium">{routeLabel}:</span>
                      <span className="text-primary font-semibold tabular-nums">{valDesc}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md bg-muted/50 p-2 flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Tarifa / Regla</span>
            <span className="font-bold text-sm text-primary tabular-nums">
              {agreement.calculationType === "rate_per_km" && `${formatMxCurrency(agreement.ratePerKm ?? 0)} / km`}
              {agreement.calculationType === "percentage_of_freight" && `${agreement.percentageRate ?? 0}% del flete`}
              {agreement.calculationType === "fixed_per_trip" && `${formatMxCurrency(agreement.baseRate ?? 0)} / viaje`}
              {agreement.calculationType === "fixed_daily_rate" && `${formatMxCurrency(agreement.helperDailyRate ?? 0)} / día`}
              {agreement.calculationType === "salary_only" && "Solo sueldo"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Desde {formatDate(agreement.effectiveFrom)}
            {agreement.effectiveTo ? ` hasta ${formatDate(agreement.effectiveTo)}` : ""}
          </span>
        </div>

        {agreement.notes ? (
          <p className="text-muted-foreground line-clamp-2 italic pt-1 border-t">
            {agreement.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CompensationAgreementCardSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5 w-full max-w-[140px]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  );
}
