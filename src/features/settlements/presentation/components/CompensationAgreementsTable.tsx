/**
 * CompensationAgreementsTable — tarifas de operadores (`EntityListTable`).
 *
 * Operador · Esquema/sueldo · Reglas · Vigencia · Estado · Acciones.
 * density compact · framed false (borde host). Empty = texto del listado (sin EmptyState).
 *
 * Nota: solo export/tests hoy (sin página host); se migra por inventario R5 P4.
 */

import { useMemo, type ReactNode } from "react";
import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
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

const TABLE_ARIA = "Listado de tarifas de operadores";

interface CompensationAgreementsTableProps {
  agreements: CompensationAgreement[];
  isLoading: boolean;
}

function schemeAccessor(agr: CompensationAgreement): EntityListStackedValue {
  const isComposite =
    agr.hasFixedSalary || (agr.rules && agr.rules.length > 0);

  if (isComposite) {
    const primary =
      agr.hasFixedSalary && (agr.fixedSalaryAmount ?? 0) > 0 ? (
        <span>
          {formatMxCurrency(agr.fixedSalaryAmount ?? 0)}{" "}
          <span className="text-xs text-muted-foreground font-normal">
            (
            {COMPENSATION_SALARY_PERIOD_LABELS[
              agr.fixedSalaryPeriod as CompensationSalaryPeriod
            ] ?? "semanal"}
            )
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground text-xs font-normal">
          {copy.fields.noFixedSalary}
        </span>
      );

    return {
      primary,
      secondary: (
        <span className="text-primary">{copy.fields.compositeScheme}</span>
      ),
    };
  }

  return {
    primary:
      COMPENSATION_CALCULATION_TYPE_LABELS[
        agr.calculationType as CompensationCalculationType
      ] ?? agr.calculationType,
  };
}

function rulesNode(agr: CompensationAgreement): ReactNode {
  const isComposite =
    agr.hasFixedSalary || (agr.rules && agr.rules.length > 0);

  if (isComposite && agr.rules && agr.rules.length > 0) {
    return (
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
            <div
              key={r.id ?? idx}
              className="flex items-center gap-1.5 text-muted-foreground"
            >
              <span className="font-medium text-foreground">{routeLabel}:</span>
              <span className="text-primary font-semibold tabular-nums">
                {valDesc}
              </span>
              {(r.minimumGuaranteedAmount ?? 0) > 0 ? (
                <span className="text-[10px] text-muted-foreground">
                  ({copy.fields.minGuaranteedPrefix}{" "}
                  {formatMxCurrency(r.minimumGuaranteedAmount ?? 0)})
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="font-semibold text-primary tabular-nums">
      {agr.calculationType === "rate_per_km" &&
        `${formatMxCurrency(agr.ratePerKm ?? 0)} / km`}
      {agr.calculationType === "percentage_of_freight" &&
        `${agr.percentageRate ?? 0}% del flete`}
      {agr.calculationType === "fixed_per_trip" &&
        `${formatMxCurrency(agr.baseRate ?? 0)} / viaje`}
      {agr.calculationType === "fixed_daily_rate" &&
        `${formatMxCurrency(agr.helperDailyRate ?? 0)} / día`}
      {agr.calculationType === "salary_only" && copy.fields.salaryOnly}
    </div>
  );
}

function buildColumns(
  conflictIds: Set<string>,
): EntityListColumnDef<CompensationAgreement>[] {
  return [
    {
      id: "employee",
      header: copy.fields.employee,
      kind: "text",
      className: "min-w-[160px] whitespace-nowrap font-medium",
      accessor: (agr) => agr.employeeFullName ?? null,
    },
    {
      id: "scheme",
      header: copy.fields.schemeSalary,
      kind: "stacked",
      className: "min-w-[160px]",
      accessor: (agr) => schemeAccessor(agr),
    },
    {
      id: "rules",
      header: copy.fields.commissionRules,
      kind: "status",
      className: "min-w-[220px] text-xs",
      accessor: (agr) => rulesNode(agr),
    },
    {
      id: "validity",
      header: copy.fields.validity,
      kind: "meta",
      className: "min-w-[160px] whitespace-nowrap",
      accessor: (agr) =>
        `${copy.fields.fromPrefix} ${formatDate(agr.effectiveFrom)}${
          agr.effectiveTo
            ? ` ${copy.fields.toPrefix} ${formatDate(agr.effectiveTo)}`
            : ""
        }`,
    },
    {
      id: "status",
      header: copy.fields.status,
      kind: "status",
      className: "min-w-[110px]",
      accessor: (agr) => {
        const hasOverlapConflict = conflictIds.has(agr.id);
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={agr.isActive ? "success" : "neutral"} tone="soft">
              {agr.isActive
                ? copy.fields.activeStatus
                : copy.fields.inactiveStatus}
            </Badge>
            {hasOverlapConflict ? (
              <Badge variant="warning" tone="soft">
                {copy.fields.overlapConflictStatus}
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (agr) => <CompensationAgreementActions agreement={agr} />,
    },
  ];
}

export function CompensationAgreementsTable({
  agreements,
  isLoading,
}: CompensationAgreementsTableProps) {
  const conflictIds = useMemo(
    () => getAgreementIdsWithOverlapConflict(agreements),
    [agreements],
  );

  if (!isLoading && agreements.length === 0) {
    return (
      <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        {copy.empty.agreements}
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <EntityListTable
        framed={false}
        density="compact"
        columns={buildColumns(conflictIds)}
        rows={agreements}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        aria-label={TABLE_ARIA}
      />
    </div>
  );
}
