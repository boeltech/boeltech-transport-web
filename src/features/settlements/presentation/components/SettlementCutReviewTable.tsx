/**
 * SettlementCutReviewTable — revisión del corte (`EntityListTable` compact).
 *
 * Operador · Aviso · Monto · Acción. Grupos con/ready fuera de la tabla.
 * density compact · framed false. Empty → null por grupo.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementCutPreviewRow } from "../../domain/settlementCut";
import {
  cutEffectAllowsNetDisplay,
  primaryCutWarningMessage,
  resolveCutRowWarningUi,
  type SettlementCutRowAction,
} from "../utils/settlementCutWarnings";
import { employmentTypeLabel } from "../utils/employmentTypeLabel";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.cutWizard.review;

function actionLabel(action: SettlementCutRowAction): string | null {
  if (!action) return null;
  switch (action) {
    case "assign_tariff":
      return copy.actions.assignTariff;
    case "view_operator":
      return copy.actions.viewOperator;
    case "view_payment":
      return copy.actions.viewPayment;
    case "review":
      return copy.actions.review;
    case "change_amount":
      return copy.actions.changeAmount;
    case "view_trip":
      return copy.actions.viewTrip;
    case "view_history":
      return copy.actions.viewHistory;
    case "split_advance":
      return copy.actions.splitAdvance;
    case "define_payee":
      return copy.actions.definePayee;
    case "confirm_zero_km":
      return copy.actions.confirmZeroKm;
    case "view":
      return copy.actions.view;
    default:
      return null;
  }
}

function RowAmount({ row }: { row: SettlementCutPreviewRow }) {
  if (row.effect === "excluded") {
    return (
      <span className="text-xs text-muted-foreground">{copy.outsideOfCut}</span>
    );
  }
  if (row.effect === "blocking" || !cutEffectAllowsNetDisplay(row.effect)) {
    return (
      <span className="text-xs text-destructive">{copy.blockedAmount}</span>
    );
  }
  if (row.estimatedNet == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="font-mono tabular-nums">
      {formatMxCurrency(row.estimatedNet)}
    </span>
  );
}

function rowSubtitle(row: SettlementCutPreviewRow): string {
  if (row.tripIds.length > 0) {
    return copy.tripsSubtitle(row.tripIds.length);
  }
  return employmentTypeLabel(row.employmentType) || "—";
}

function buildColumns(
  onAction: (row: SettlementCutPreviewRow, action: SettlementCutRowAction) => void,
): EntityListColumnDef<SettlementCutPreviewRow>[] {
  return [
    {
      id: "operator",
      header: copy.columns.operator,
      kind: "stacked",
      accessor: (row): EntityListStackedValue => ({
        primary: row.employeeFullName,
        secondary: rowSubtitle(row),
      }),
    },
    {
      id: "warning",
      header: copy.columns.warning,
      kind: "status",
      accessor: (row) => {
        const ui = resolveCutRowWarningUi(row);
        const longMessage = primaryCutWarningMessage(row);
        if (!ui) {
          return (
            <span className="text-muted-foreground">{copy.noWarning}</span>
          );
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={ui.badgeVariant} tone="soft" className="max-w-full">
                {ui.label}
              </Badge>
            </TooltipTrigger>
            {longMessage ? (
              <TooltipContent className="max-w-xs text-left">
                {longMessage}
              </TooltipContent>
            ) : null}
          </Tooltip>
        );
      },
    },
    {
      id: "amount",
      header: copy.columns.amount,
      kind: "status",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (row) => <RowAmount row={row} />,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (row) => {
        const ui = resolveCutRowWarningUi(row);
        const action = ui?.action ?? (row.effect === "includable" ? "view" : null);
        const label = actionLabel(action);
        if (!label || !action) return null;
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAction(row, action)}
          >
            {label}
          </Button>
        );
      },
    },
  ];
}

export interface SettlementCutReviewTableProps {
  withWarning: readonly SettlementCutPreviewRow[];
  ready: readonly SettlementCutPreviewRow[];
  readyExpanded: boolean;
  onToggleReady: () => void;
  filter: "all" | "with_warning" | "ready";
  onAction: (row: SettlementCutPreviewRow, action: SettlementCutRowAction) => void;
}

const READY_PREVIEW = 3;

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
      {children}
    </div>
  );
}

export function SettlementCutReviewTable({
  withWarning,
  ready,
  readyExpanded,
  onToggleReady,
  filter,
  onAction,
}: SettlementCutReviewTableProps) {
  const showWithWarning = filter !== "ready";
  const showReady = filter !== "with_warning";
  const readyVisible =
    filter === "ready" || readyExpanded
      ? ready
      : ready.slice(0, READY_PREVIEW);
  const hiddenReady =
    filter === "all" && !readyExpanded
      ? Math.max(0, ready.length - READY_PREVIEW)
      : 0;

  const columns = buildColumns(onAction);
  const hasAny =
    (showWithWarning && withWarning.length > 0) ||
    (showReady && ready.length > 0);

  if (!hasAny) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto space-y-3" data-testid="cut-review-table">
        {showWithWarning && withWarning.length > 0 ? (
          <div>
            <GroupLabel>{copy.groupWithWarning(withWarning.length)}</GroupLabel>
            <EntityListTable
              framed={false}
              density="compact"
              columns={columns}
              rows={[...withWarning]}
              getRowId={(row) => row.employeeId}
              getRowClassName={(row) =>
                row.effect === "excluded" ? "text-muted-foreground" : undefined
              }
              getRowProps={(row) =>
                ({
                  "data-testid": `cut-row-${row.employeeId}`,
                  "data-effect": row.effect,
                }) as HTMLAttributes<HTMLTableRowElement>
              }
            />
          </div>
        ) : null}

        {showReady && ready.length > 0 ? (
          <div>
            <GroupLabel>{copy.groupReady(ready.length)}</GroupLabel>
            <EntityListTable
              framed={false}
              density="compact"
              columns={columns}
              rows={[...readyVisible]}
              getRowId={(row) => row.employeeId}
              getRowClassName={(row) =>
                row.effect === "excluded" ? "text-muted-foreground" : undefined
              }
              getRowProps={(row) =>
                ({
                  "data-testid": `cut-row-${row.employeeId}`,
                  "data-effect": row.effect,
                }) as HTMLAttributes<HTMLTableRowElement>
              }
            />
            {hiddenReady > 0 ? (
              <div className="px-2.5 py-3 text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={onToggleReady}
                >
                  {copy.expandReady(hiddenReady)}
                </button>
              </div>
            ) : null}
            {filter === "all" &&
            readyExpanded &&
            ready.length > READY_PREVIEW ? (
              <div className="px-2.5 py-3 text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                  onClick={onToggleReady}
                >
                  {copy.collapseReady}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
