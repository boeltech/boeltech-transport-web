import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import {
  COMPENSATION_SALARY_PERIOD_LABELS,
  type CompensationSalaryPeriod,
} from "../../domain/enums";
import { SETTLEMENTS_OPERATORS_PATH } from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.detailPage.inspector;

interface SettlementDetailInspectorProps {
  settlement: DriverSettlement;
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "";
}

/**
 * Inspector sticky: Por qué / Cómo se le paga / Actividad (CA F4.9).
 */
export function SettlementDetailInspector({
  settlement,
}: SettlementDetailInspectorProps) {
  const name = firstName(settlement.employeeFullName);
  const snap = settlement.agreementSnapshot;
  const trips =
    settlement.items?.filter((i) => i.itemType === "trip_commission") ?? [];
  const fixedTrips = trips.filter((t) =>
    (t.calculationDetails?.appliedRule ?? "").toLowerCase().includes("fija"),
  );
  const otherTrips = trips.length - fixedTrips.length;
  const hasReimbursements = settlement.totalReimbursableExpenses > 0;
  const hasDeductions =
    settlement.totalAdvancesDeducted + settlement.totalOtherDeductions > 0;

  const whyLines: string[] = [];
  if (fixedTrips.length > 0) {
    whyLines.push(
      copy.whyTripFixed(
        fixedTrips.length,
        formatMxCurrency(fixedTrips.reduce((s, t) => s + t.amount, 0)),
      ),
    );
  }
  if (otherTrips > 0) {
    whyLines.push(copy.whyTripsCommission(otherTrips));
  }
  if (settlement.totalBaseSalary > 0) {
    whyLines.push(copy.whySalary);
  }
  if (hasReimbursements) {
    whyLines.push(copy.whyReimbursements);
  }
  if (hasDeductions) {
    whyLines.push(copy.whyDeductions);
  }

  const periodKey = snap.fixedSalaryPeriod as CompensationSalaryPeriod | undefined;
  const rhythm =
    periodKey && COMPENSATION_SALARY_PERIOD_LABELS[periodKey]
      ? COMPENSATION_SALARY_PERIOD_LABELS[periodKey]
      : "—";

  const activity: { text: string; at: string | null }[] = [];
  if (settlement.approvedAt) {
    activity.push({
      text: `${settlement.approvedByName ?? "Alguien"} autorizó`,
      at: settlement.approvedAt,
    });
  }
  if (settlement.submittedAt) {
    activity.push({
      text: `${settlement.submittedByName ?? settlement.createdByName ?? "Alguien"} envió a autorización`,
      at: settlement.submittedAt,
    });
  }
  if (settlement.disbursedAt) {
    activity.push({
      text: `${settlement.disbursedByName ?? "Alguien"} registró el pago`,
      at: settlement.disbursedAt,
    });
  }

  return (
    <aside className="space-y-4" data-testid="settlement-detail-inspector">
      <section className="rounded-2xl border bg-card">
        <div className="px-5 pt-4">
          <h2 className="text-base font-semibold">{copy.whyTitle}</h2>
        </div>
        <div className="px-5 py-4">
          {whyLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.emptyWhy}</p>
          ) : (
            <ul className="list-disc space-y-1.5 pl-4 text-sm">
              {whyLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="px-5 pt-4">
          <h2 className="text-base font-semibold">{copy.howTitle(name)}</h2>
        </div>
        <div className="space-y-3 px-5 py-4">
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">{copy.tariff}</dt>
            <dd>
              {snap.calculationType
                ? String(snap.calculationType)
                : settlementsCopy.detailPage.fallbacks.noAgreement}
            </dd>
            <dt className="text-muted-foreground">{copy.rhythm}</dt>
            <dd>{rhythm}</dd>
            <dt className="text-muted-foreground">{copy.baseSalary}</dt>
            <dd className="font-mono tabular-nums">
              {formatMxCurrency(snap.fixedSalaryAmount ?? settlement.totalBaseSalary)}
            </dd>
            <dt className="text-muted-foreground">{copy.account}</dt>
            <dd className="font-mono text-muted-foreground">
              {settlement.disbursementReference
                ? `SPEI ·· ${settlement.disbursementReference.slice(-4)}`
                : copy.accountMissing}
            </dd>
          </dl>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to={SETTLEMENTS_OPERATORS_PATH}>
              {copy.viewPayeeCard}
            </Link>
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="px-5 pt-4">
          <h2 className="text-base font-semibold">{copy.activityTitle}</h2>
        </div>
        <div className="space-y-2 px-5 py-4 text-sm">
          {activity.length === 0 ? (
            <p className="text-muted-foreground">—</p>
          ) : (
            activity.map((row) => (
              <div key={`${row.text}-${row.at}`}>
                <div>{row.text}</div>
                {row.at ? (
                  <div className="text-xs text-muted-foreground">
                    {formatDate(row.at)}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
