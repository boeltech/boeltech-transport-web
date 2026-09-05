/**
 * CompensationAgreementsTable
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente de tabla para listar tarifas y reglas de compensación de choferes.
 * Soporta esquemas compuestos (ADR-0086) y esquemas planos (ADR-0085).
 *
 * Ubicación: src/features/settlements/presentation/components/CompensationAgreementsTable.tsx
 */

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
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

// ============================================================================
// TYPES
// ============================================================================

interface CompensationAgreementsTableProps {
  agreements: CompensationAgreement[];
  isLoading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABLE_HEADERS = [
  { key: "employee", label: copy.fields.employee, className: "min-w-[160px]" },
  { key: "calculationType", label: copy.fields.schemeSalary, className: "min-w-[160px]" },
  { key: "rateFormula", label: copy.fields.commissionRules, className: "min-w-[220px]" },
  { key: "validity", label: copy.fields.validity, className: "min-w-[160px]" },
  { key: "status", label: copy.fields.status, className: "min-w-[110px]" },
  { key: "actions", label: "", className: "w-12 text-right" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center text-muted-foreground text-sm">
          {copy.empty.agreements}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompensationAgreementsTable({
  agreements,
  isLoading,
}: CompensationAgreementsTableProps) {
  const conflictIds = useMemo(
    () => getAgreementIdsWithOverlapConflict(agreements),
    [agreements],
  );

  if (isLoading) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de tarifas de operadores">
          <TableHeaderRow />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (agreements.length === 0) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table aria-label="Listado de tarifas de operadores">
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table aria-label="Listado de tarifas de operadores">
        <TableHeaderRow />
        <TableBody>
          {agreements.map((agr) => {
            const isComposite = agr.hasFixedSalary || (agr.rules && agr.rules.length > 0);
            const hasOverlapConflict = conflictIds.has(agr.id);

            return (
              <TableRow key={agr.id} className="hover:bg-muted/50 transition-colors">
                {/* Operador */}
                <TableCell className="font-medium whitespace-nowrap">
                  {agr.employeeFullName ?? "—"}
                </TableCell>

                {/* Esquema / Sueldo base */}
                <TableCell className="whitespace-nowrap">
                  {isComposite ? (
                    <div>
                      {agr.hasFixedSalary && (agr.fixedSalaryAmount ?? 0) > 0 ? (
                        <p className="font-semibold text-foreground">
                          {formatMxCurrency(agr.fixedSalaryAmount ?? 0)}{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            ({COMPENSATION_SALARY_PERIOD_LABELS[agr.fixedSalaryPeriod as CompensationSalaryPeriod] ?? "semanal"})
                          </span>
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-xs">{copy.fields.noFixedSalary}</span>
                      )}
                      <p className="text-[11px] text-primary">{copy.fields.compositeScheme}</p>
                    </div>
                  ) : (
                    <span>
                      {COMPENSATION_CALCULATION_TYPE_LABELS[
                        agr.calculationType as CompensationCalculationType
                      ] ?? agr.calculationType}
                    </span>
                  )}
                </TableCell>

                {/* Reglas de comisión / Tarifa */}
                <TableCell className="text-xs">
                  {isComposite && agr.rules && agr.rules.length > 0 ? (
                    <div className="space-y-1">
                      {agr.rules.map((r, idx) => {
                        const routeLabel = TRIP_ROUTE_TYPE_LABELS[r.routeType] ?? r.routeType;
                        let valDesc: string = copy.fields.noCommission;
                        if (r.commissionType === "rate_per_km") {
                          valDesc = `${formatMxCurrency(r.rateValue)}/km`;
                        } else if (r.commissionType === "percentage_of_freight") {
                          valDesc = `${r.rateValue}% flete`;
                        } else if (r.commissionType === "fixed_per_trip") {
                          valDesc = `${formatMxCurrency(r.rateValue)}/viaje`;
                        }

                        return (
                          <div key={r.id ?? idx} className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="font-medium text-foreground">{routeLabel}:</span>
                            <span className="text-primary font-semibold tabular-nums">{valDesc}</span>
                            {(r.minimumGuaranteedAmount ?? 0) > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                ({copy.fields.minGuaranteedPrefix} {formatMxCurrency(r.minimumGuaranteedAmount ?? 0)})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="font-semibold text-primary tabular-nums">
                      {agr.calculationType === "rate_per_km" && `${formatMxCurrency(agr.ratePerKm ?? 0)} / km`}
                      {agr.calculationType === "percentage_of_freight" && `${agr.percentageRate ?? 0}% del flete`}
                      {agr.calculationType === "fixed_per_trip" && `${formatMxCurrency(agr.baseRate ?? 0)} / viaje`}
                      {agr.calculationType === "fixed_daily_rate" && `${formatMxCurrency(agr.helperDailyRate ?? 0)} / día`}
                      {agr.calculationType === "salary_only" && copy.fields.salaryOnly}
                    </div>
                  )}
                </TableCell>

                {/* Vigencia */}
                <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                  {copy.fields.fromPrefix} {formatDate(agr.effectiveFrom)}
                  {agr.effectiveTo ? ` ${copy.fields.toPrefix} ${formatDate(agr.effectiveTo)}` : ""}
                </TableCell>

                {/* Estado */}
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={agr.isActive ? "success" : "neutral"} tone="soft">
                      {agr.isActive ? copy.fields.activeStatus : copy.fields.inactiveStatus}
                    </Badge>
                    {hasOverlapConflict && (
                      <Badge variant="warning" tone="soft">
                        {copy.fields.overlapConflictStatus}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Acciones */}
                <TableCell className="w-12 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <CompensationAgreementActions agreement={agr} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
