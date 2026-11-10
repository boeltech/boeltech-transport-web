import { AlertWithIcon } from "@shared/ui/alert";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementCutPreviewRow } from "../../domain/settlementCut";
import { resolveCutRowWarningUi } from "../utils/settlementCutWarnings";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.cutWizard.review;

export interface SettlementCutInspectorProps {
  includableCount: number;
  totalOperators: number;
  estimatedNetTotal: number;
  excluded: readonly SettlementCutPreviewRow[];
}

export function SettlementCutInspector({
  includableCount,
  totalOperators,
  estimatedNetTotal,
  excluded,
}: SettlementCutInspectorProps) {
  return (
    <aside
      className="flex flex-col gap-4 lg:sticky lg:top-4"
      data-testid="cut-inspector"
    >
      <div className="rounded-2xl border bg-card">
        <div className="space-y-1 border-b px-5 py-4">
          <h2 className="text-base font-semibold leading-6">{copy.inspectorTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {copy.inspectorIncluded(includableCount, totalOperators)}
          </p>
        </div>
        <div className="space-y-1 px-5 py-4">
          <div className="flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-3">
            <span className="font-semibold">{copy.inspectorNet}</span>
            <span className="font-mono text-xl font-semibold tabular-nums">
              {formatMxCurrency(estimatedNetTotal)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{copy.inspectorNetHint}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold leading-6">
            {copy.outsideTitle(excluded.length)}
          </h2>
        </div>
        <div className="space-y-2 px-5 py-4 text-sm">
          {excluded.length === 0 ? (
            <p className="text-muted-foreground">{copy.outsideEmpty}</p>
          ) : (
            excluded.map((row) => {
              const ui = resolveCutRowWarningUi(row);
              const reason =
                row.warnings[0]?.message ?? ui?.label ?? copy.outsideOfCut;
              return (
                <p key={row.employeeId}>
                  <span className="font-semibold">{row.employeeFullName}</span>
                  {" · "}
                  <span className="text-muted-foreground">{reason}</span>
                </p>
              );
            })
          )}
        </div>
      </div>

      <AlertWithIcon variant="info" title={copy.sendAlertTitle}>
        {copy.sendAlertBody(includableCount)}
      </AlertWithIcon>
    </aside>
  );
}
