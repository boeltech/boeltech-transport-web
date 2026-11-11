import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
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

function RowSubtitle({ row }: { row: SettlementCutPreviewRow }) {
  if (row.tripIds.length > 0) {
    return <>{copy.tripsSubtitle(row.tripIds.length)}</>;
  }
  const humanType = employmentTypeLabel(row.employmentType);
  return <>{humanType || "—"}</>;
}

function CutRow({
  row,
  onAction,
}: {
  row: SettlementCutPreviewRow;
  onAction: (row: SettlementCutPreviewRow, action: SettlementCutRowAction) => void;
}) {
  const ui = resolveCutRowWarningUi(row);
  const action = ui?.action ?? (row.effect === "includable" ? "view" : null);
  const label = actionLabel(action);
  const muted = row.effect === "excluded";
  const longMessage = primaryCutWarningMessage(row);

  return (
    <tr
      className={muted ? "text-muted-foreground" : undefined}
      data-testid={`cut-row-${row.employeeId}`}
      data-effect={row.effect}
    >
      <td className="px-2.5 py-2.5 align-middle">
        <div className="flex flex-col">
          <span
            className={
              muted
                ? "whitespace-nowrap font-medium text-foreground"
                : "whitespace-nowrap font-medium"
            }
          >
            {row.employeeFullName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            <RowSubtitle row={row} />
          </span>
        </div>
      </td>
      <td className="px-2.5 py-2.5 align-middle">
        {ui ? (
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
        ) : (
          <span className="text-muted-foreground">{copy.noWarning}</span>
        )}
      </td>
      <td className="px-2.5 py-2.5 text-right align-middle">
        <RowAmount row={row} />
      </td>
      <td className="px-2.5 py-2.5 text-right align-middle whitespace-nowrap">
        {label && action ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAction(row, action)}
          >
            {label}
          </Button>
        ) : null}
      </td>
    </tr>
  );
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto" data-testid="cut-review-table">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b px-2.5 pb-1.5 text-left text-xs font-medium text-muted-foreground">
                {copy.columns.operator}
              </th>
              <th className="border-b px-2.5 pb-1.5 text-left text-xs font-medium text-muted-foreground">
                {copy.columns.warning}
              </th>
              <th className="border-b px-2.5 pb-1.5 text-right text-xs font-medium text-muted-foreground">
                {copy.columns.amount}
              </th>
              <th className="border-b px-2.5 pb-1.5" />
            </tr>
          </thead>
          <tbody>
            {showWithWarning && withWarning.length > 0 ? (
              <>
                <tr className="bg-muted">
                  <td
                    colSpan={4}
                    className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    {copy.groupWithWarning(withWarning.length)}
                  </td>
                </tr>
                {withWarning.map((row) => (
                  <CutRow key={row.employeeId} row={row} onAction={onAction} />
                ))}
              </>
            ) : null}

            {showReady && ready.length > 0 ? (
              <>
                <tr className="bg-muted">
                  <td
                    colSpan={4}
                    className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    {copy.groupReady(ready.length)}
                  </td>
                </tr>
                {readyVisible.map((row) => (
                  <CutRow key={row.employeeId} row={row} onAction={onAction} />
                ))}
                {hiddenReady > 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2.5 py-3 text-center">
                      <button
                        type="button"
                        className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                        onClick={onToggleReady}
                      >
                        {copy.expandReady(hiddenReady)}
                      </button>
                    </td>
                  </tr>
                ) : null}
                {filter === "all" && readyExpanded && ready.length > READY_PREVIEW ? (
                  <tr>
                    <td colSpan={4} className="px-2.5 py-3 text-center">
                      <button
                        type="button"
                        className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                        onClick={onToggleReady}
                      >
                        {copy.collapseReady}
                      </button>
                    </td>
                  </tr>
                ) : null}
              </>
            ) : null}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
