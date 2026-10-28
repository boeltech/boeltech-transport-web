import { useState } from "react";
import { Link } from "react-router-dom";
import {
  usePlatformModules,
  usePlatformStampPackCatalog,
} from "../../application/hooks/usePlatformBilling";
import { usePlatformPlans } from "../../application/hooks/usePlatformTenants";
import { opsCopy } from "./opsCopy";
import { OpsUseInTenantSheet } from "./OpsUseInTenantSheet";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
} from "./ui/OpsTable";

type CatalogTab = "plans" | "modules" | "packs";

/**
 * Catálogo comercial ops (planes / add-ons / stamp packs).
 * Sin inventar $ (HB-G2): copy «Lista pendiente de calibración».
 */
export function PlatformCommercialCatalogPage() {
  const copy = opsCopy.catalog;
  const [tab, setTab] = useState<CatalogTab>("plans");
  const [useIn, setUseIn] = useState<{
    kind: "plan" | "module";
    code: string;
    label: string;
  } | null>(null);

  const plansQuery = usePlatformPlans();
  const modulesQuery = usePlatformModules();
  const packsQuery = usePlatformStampPackCatalog();

  const plans = (plansQuery.data ?? []).filter((p) => p.isActive);
  const modules = modulesQuery.data ?? [];
  const packs = (packsQuery.data ?? []).filter((p) => p.isActive);

  const isLoading =
    (tab === "plans" && plansQuery.isLoading) ||
    (tab === "modules" && modulesQuery.isLoading) ||
    (tab === "packs" && packsQuery.isLoading);
  const isError =
    (tab === "plans" && plansQuery.isError) ||
    (tab === "modules" && modulesQuery.isError) ||
    (tab === "packs" && packsQuery.isError);

  const refetch = () => {
    if (tab === "plans") void plansQuery.refetch();
    if (tab === "modules") void modulesQuery.refetch();
    if (tab === "packs") void packsQuery.refetch();
  };

  return (
    <div data-testid="platform-commercial-catalog" className="space-y-3">
      <div>
        <h1 className="ops-type-h2 ops-text m-0">{copy.title}</h1>
        <p className="mt-1 max-w-xl text-xs ops-text-muted">{copy.description}</p>
        <p className="mt-1 text-xs ops-text-warn">{copy.pricePending}</p>
      </div>

      <div
        className="ops-border flex flex-wrap gap-0 border-b"
        role="tablist"
        aria-label={copy.title}
      >
        {(
          [
            ["plans", copy.tabs.plans],
            ["modules", copy.tabs.modules],
            ["packs", copy.tabs.packs],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="ops-tab"
            data-active={tab === id}
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {isError ? (
        <OpsEmptyState
          variant="error"
          title={copy.error}
          action={
            <OpsButton variant="ghost" size="sm" onClick={refetch}>
              {copy.retry}
            </OpsButton>
          }
        />
      ) : null}

      {isLoading ? (
        <OpsEmptyState variant="loading" title={copy.loading} panel />
      ) : null}

      {!isLoading && !isError && tab === "plans" ? (
        plans.length === 0 ? (
          <OpsEmptyState title={copy.empty} />
        ) : (
          <OpsTable>
            <OpsTableHeader>
              <OpsTableRow>
                <OpsTableHead>{copy.columns.name}</OpsTableHead>
                <OpsTableHead>{copy.columns.code}</OpsTableHead>
                <OpsTableHead>{copy.columns.capacity}</OpsTableHead>
                <OpsTableHead>{copy.columns.stamps}</OpsTableHead>
                <OpsTableHead>{copy.columns.action}</OpsTableHead>
              </OpsTableRow>
            </OpsTableHeader>
            <OpsTableBody>
              {plans.map((plan) => (
                <OpsTableRow key={plan.code}>
                  <OpsTableCell className="ops-text">{plan.name}</OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {plan.code}
                  </OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {copy.motrizBand(plan.bandQMin, plan.bandQMax)}
                  </OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {plan.stampsPerMotriz}/motriz
                  </OpsTableCell>
                  <OpsTableCell>
                    <OpsButton
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setUseIn({
                          kind: "plan",
                          code: plan.code,
                          label: plan.name,
                        })
                      }
                    >
                      {copy.useInTenant}
                    </OpsButton>
                  </OpsTableCell>
                </OpsTableRow>
              ))}
            </OpsTableBody>
          </OpsTable>
        )
      ) : null}

      {!isLoading && !isError && tab === "modules" ? (
        modules.length === 0 ? (
          <OpsEmptyState title={copy.empty} />
        ) : (
          <OpsTable>
            <OpsTableHeader>
              <OpsTableRow>
                <OpsTableHead>{copy.columns.name}</OpsTableHead>
                <OpsTableHead>{copy.columns.code}</OpsTableHead>
                <OpsTableHead>{copy.columns.action}</OpsTableHead>
              </OpsTableRow>
            </OpsTableHeader>
            <OpsTableBody>
              {modules.map((mod) => (
                <OpsTableRow key={mod.code}>
                  <OpsTableCell className="ops-text">{mod.name}</OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {mod.code}
                  </OpsTableCell>
                  <OpsTableCell>
                    <OpsButton
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setUseIn({
                          kind: "module",
                          code: mod.code,
                          label: mod.name,
                        })
                      }
                    >
                      {copy.useInTenant}
                    </OpsButton>
                  </OpsTableCell>
                </OpsTableRow>
              ))}
            </OpsTableBody>
          </OpsTable>
        )
      ) : null}

      {!isLoading && !isError && tab === "packs" ? (
        packs.length === 0 ? (
          <OpsEmptyState title={copy.empty} />
        ) : (
          <OpsTable>
            <OpsTableHeader>
              <OpsTableRow>
                <OpsTableHead>{copy.columns.name}</OpsTableHead>
                <OpsTableHead>{copy.columns.code}</OpsTableHead>
                <OpsTableHead>{copy.columns.stamps}</OpsTableHead>
                <OpsTableHead>{copy.columns.action}</OpsTableHead>
              </OpsTableRow>
            </OpsTableHeader>
            <OpsTableBody>
              {packs.map((pack) => (
                <OpsTableRow key={pack.code}>
                  <OpsTableCell className="ops-text">{pack.name}</OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {pack.code}
                  </OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {copy.packStamps(pack.stamps)}
                  </OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {copy.pricePending}
                  </OpsTableCell>
                </OpsTableRow>
              ))}
            </OpsTableBody>
          </OpsTable>
        )
      ) : null}

      <Link
        to="/platform/catalogs"
        className="inline-flex text-xs ops-text-accent hover:underline"
      >
        {copy.satLink}
      </Link>

      <OpsUseInTenantSheet
        open={Boolean(useIn)}
        onOpenChange={(next) => {
          if (!next) setUseIn(null);
        }}
        kind={useIn?.kind ?? "plan"}
        code={useIn?.code ?? null}
        label={useIn?.label}
      />
    </div>
  );
}
