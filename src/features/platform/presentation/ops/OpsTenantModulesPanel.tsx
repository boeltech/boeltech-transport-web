import { useState } from "react";
import { formatDate } from "@shared/utils/dateUtils";
import type { PlatformTenantEntitlements } from "../../domain/entities";
import { usePlatformTenantEntitlements } from "../../application/hooks/usePlatformBilling";
import { getProfitabilityLevelDetail } from "../utils/platformBillingFormatters";
import { opsCopy } from "./opsCopy";
import {
  OpsRemoveAddonDialog,
  type OpsRemoveAddonTarget,
} from "./OpsRemoveAddonDialog";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import {
  OpsMoneyAmount,
  OpsMoneyTable,
  OpsMoneyTableBody,
  OpsMoneyTableCell,
  OpsMoneyTableHead,
  OpsMoneyTableHeader,
  OpsMoneyTableRow,
} from "./patterns/OpsMoneyTable";
import {
  OpsBadge,
  OpsButton,
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
  OpsTablePrimary,
} from "./ui";

interface OpsTenantModulesPanelProps {
  tenantId: string;
  canMutate: boolean;
  onAddAddon: () => void;
}

/** Complementos directos del tenant (tab Suscripción del hub). */
export function OpsTenantModulesPanel({
  tenantId,
  canMutate,
  onAddAddon,
}: OpsTenantModulesPanelProps) {
  const copy = opsCopy.hub.modules;
  const { data, isLoading, isError, refetch } =
    usePlatformTenantEntitlements(tenantId);
  const [removeTarget, setRemoveTarget] =
    useState<OpsRemoveAddonTarget | null>(null);

  const catalogNames = new Map(
    (data?.catalog ?? []).map((item) => [item.code, item.name]),
  );
  const resolveName = (code: string) => catalogNames.get(code) ?? code;
  const isRetired = (
    item: PlatformTenantEntitlements["directEntitlements"][number],
  ) =>
    item.moduleName === item.moduleCode && !catalogNames.has(item.moduleCode);

  const modules = data?.directEntitlements ?? [];
  const addButton = canMutate ? (
    <OpsButton size="sm" variant="ghost" onClick={onAddAddon}>
      {copy.add}
    </OpsButton>
  ) : null;

  return (
    <OpsPanel data-testid="ops-tenant-modules">
      <OpsPanelHeader>
        <OpsPanelTitle>{copy.title}</OpsPanelTitle>
        <OpsPanelDescription>{copy.description}</OpsPanelDescription>
        {modules.length > 0 ? addButton : null}
      </OpsPanelHeader>
      <OpsPanelBody className="space-y-3">
        {isLoading ? (
          <OpsEmptyState variant="loading" title={copy.loading} />
        ) : isError || !data ? (
          <OpsEmptyState
            variant="error"
            title={copy.error.title}
            description={copy.error.description}
            action={
              <OpsButton
                variant="ghost"
                size="sm"
                onClick={() => void refetch()}
              >
                {copy.error.retry}
              </OpsButton>
            }
          />
        ) : modules.length === 0 ? (
          <OpsEmptyState
            title={copy.empty.title}
            description={copy.empty.description}
            action={addButton ?? undefined}
          />
        ) : (
          <>
            <OpsMoneyTable>
              <OpsMoneyTableHeader>
                <OpsMoneyTableRow>
                  <OpsMoneyTableHead>{copy.columns.module}</OpsMoneyTableHead>
                  <OpsMoneyTableHead>{copy.columns.kind}</OpsMoneyTableHead>
                  <OpsMoneyTableHead>
                    {copy.columns.activatedAt}
                  </OpsMoneyTableHead>
                  <OpsMoneyTableHead>{copy.columns.price}</OpsMoneyTableHead>
                  {canMutate ? (
                    <OpsMoneyTableHead>{copy.columns.actions}</OpsMoneyTableHead>
                  ) : null}
                </OpsMoneyTableRow>
              </OpsMoneyTableHeader>
              <OpsMoneyTableBody>
                {modules.map((item) => {
                  const retired = isRetired(item);
                  return (
                    <OpsMoneyTableRow
                      key={item.moduleCode}
                      data-testid={`ops-tenant-module-${item.moduleCode}`}
                    >
                      <OpsMoneyTableCell>
                        <OpsTablePrimary
                          title={item.moduleName}
                          meta={
                            item.memberCodes.length > 0
                              ? `${item.moduleCode} · ${copy.includes(
                                  item.memberCodes.map(resolveName).join(", "),
                                )}`
                              : item.moduleCode
                          }
                        />
                      </OpsMoneyTableCell>
                      <OpsMoneyTableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <OpsBadge tone="default">
                            {copy.kindLabels[item.kind] ?? item.kind}
                          </OpsBadge>
                          <OpsBadge tone={item.priceTier === "ea" ? "accent" : "muted"}>
                            {copy.tierLabels[item.priceTier] ?? item.priceTier}
                          </OpsBadge>
                          {retired ? (
                            <OpsBadge tone="warn">{copy.retired}</OpsBadge>
                          ) : null}
                        </div>
                      </OpsMoneyTableCell>
                      <OpsMoneyTableCell>
                        {formatDate(item.activatedAt)}
                      </OpsMoneyTableCell>
                      <OpsMoneyTableCell>
                        <OpsMoneyAmount cents={item.priceLockedCents} />
                      </OpsMoneyTableCell>
                      {canMutate ? (
                        <OpsMoneyTableCell>
                          <OpsButton
                            size="sm"
                            variant="ghost"
                            aria-label={copy.removeAria(item.moduleName)}
                            onClick={() =>
                              setRemoveTarget({
                                moduleCode: item.moduleCode,
                                moduleName: item.moduleName,
                                priceLockedCents: item.priceLockedCents,
                              })
                            }
                          >
                            {copy.remove}
                          </OpsButton>
                        </OpsMoneyTableCell>
                      ) : null}
                    </OpsMoneyTableRow>
                  );
                })}
              </OpsMoneyTableBody>
            </OpsMoneyTable>
            <div
              className="flex flex-wrap justify-between gap-2 ops-type-caption"
              data-testid="ops-tenant-modules-total"
            >
              <span className="ops-text-muted">{copy.total}</span>
              <OpsMoneyAmount cents={data.commercialSummary.modulesTotalCents} />
            </div>
          </>
        )}
        {data ? (
          <div className="flex flex-wrap justify-between gap-2 ops-type-caption">
            <span className="ops-text-muted">{copy.profitabilityLevel}</span>
            <span className="ops-text">
              {getProfitabilityLevelDetail(data.profitabilityLevel).label}
            </span>
          </div>
        ) : null}
      </OpsPanelBody>

      {canMutate ? (
        <OpsRemoveAddonDialog
          tenantId={tenantId}
          target={removeTarget}
          onOpenChange={(open) => {
            if (!open) setRemoveTarget(null);
          }}
          resolveName={resolveName}
        />
      ) : null}
    </OpsPanel>
  );
}
