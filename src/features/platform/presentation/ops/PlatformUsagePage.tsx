import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  usePlatformBillingReconciliation,
  usePlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { getMexicoCityPeriodKey } from "../utils/billingPeriod";
import { opsCopy } from "./opsCopy";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsTableSkeleton } from "./patterns/OpsTableSkeleton";
import { OpsButton } from "./ui/OpsButton";
import { OpsPanel, OpsPanelBody } from "./ui/OpsPanel";
import {
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
} from "./ui/OpsTable";

/**
 * Uso global ops: timbres del periodo + motrizes activas al seleccionar.
 */
export function PlatformUsagePage() {
  const copy = opsCopy.usage;
  const periodKey = useMemo(() => getMexicoCityPeriodKey(), []);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = usePlatformBillingReconciliation(periodKey);

  const { data: subscription, isLoading: subLoading } =
    usePlatformTenantSubscription(selectedTenantId ?? "");

  return (
    <div data-testid="platform-usage-page" className="space-y-3">
      <div>
        <h1 className="ops-type-h2 ops-text m-0">{copy.title}</h1>
        <p className="mt-1 max-w-xl text-xs ops-text-muted">{copy.description}</p>
        <p className="mt-1 text-xs ops-text-muted">{copy.period(periodKey)}</p>
        <p className="mt-2 max-w-xl ops-type-caption ops-text-muted">
          {copy.motrizHelp}
        </p>
      </div>

      {isError ? (
        <OpsEmptyState
          variant="error"
          title={copy.error}
          action={
            <OpsButton
              variant="ghost"
              size="sm"
              onClick={() => void refetch()}
            >
              {copy.retry}
            </OpsButton>
          }
        />
      ) : null}

      {isLoading ? <OpsTableSkeleton /> : null}

      {!isLoading && !isError && rows.length === 0 ? (
        <OpsEmptyState
          title={copy.empty}
          description="Cuando haya consumo del periodo, verás filas aquí."
        />
      ) : null}

      {!isLoading && !isError && rows.length > 0 ? (
        <OpsTable>
          <OpsTableHeader>
            <OpsTableRow>
              <OpsTableHead>{copy.columns.tenant}</OpsTableHead>
              <OpsTableHead>{copy.columns.plan}</OpsTableHead>
              <OpsTableHead>{copy.columns.stamps}</OpsTableHead>
              <OpsTableHead>{copy.columns.overage}</OpsTableHead>
              <OpsTableHead>{copy.columns.action}</OpsTableHead>
            </OpsTableRow>
          </OpsTableHeader>
          <OpsTableBody>
            {rows.map((row) => {
              const selected = selectedTenantId === row.tenantId;
              return (
                <OpsTableRow
                  key={row.tenantId}
                  className={selected ? "ops-bg-surface" : undefined}
                >
                  <OpsTableCell>
                    <button
                      type="button"
                      className="text-left ops-text hover:underline"
                      onClick={() => setSelectedTenantId(row.tenantId)}
                    >
                      <span className="font-medium">{row.tenantName}</span>
                      <span className="ml-1 ops-text-muted">
                        {row.subdomain}
                      </span>
                    </button>
                  </OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {row.planName ?? row.planCode ?? "—"}
                  </OpsTableCell>
                  <OpsTableCell className="tabular-nums ops-text">
                    {copy.stampsValue(row.stampsUsed, row.includedStamps)}
                  </OpsTableCell>
                  <OpsTableCell className="tabular-nums ops-text-muted">
                    {row.overageStamps}
                  </OpsTableCell>
                  <OpsTableCell>
                    <Link
                      to={`/platform/tenants/${row.tenantId}?tab=uso`}
                      className="ops-text-accent hover:underline"
                    >
                      {copy.openHub}
                    </Link>
                  </OpsTableCell>
                </OpsTableRow>
              );
            })}
          </OpsTableBody>
        </OpsTable>
      ) : null}

      <OpsPanel>
        <OpsPanelBody>
          {!selectedTenantId ? (
            <p className="text-xs ops-text-muted">{copy.selectTenant}</p>
          ) : (
            <div className="space-y-1 text-xs">
              <p className="ops-type-caption ops-text-muted">
                {copy.columns.motrices}
              </p>
              <p className="ops-type-h3 ops-text tabular-nums">
                {subLoading
                  ? "…"
                  : copy.motricesValue(subscription?.qFact ?? null)}
              </p>
              <Link
                to={`/platform/tenants/${selectedTenantId}?tab=uso`}
                className="ops-text-accent hover:underline"
              >
                {copy.openHub}
              </Link>
            </div>
          )}
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
