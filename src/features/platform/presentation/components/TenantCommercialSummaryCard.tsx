import { Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { usePlatformTenantEntitlements } from "../../application/hooks/usePlatformBilling";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPriceCents,
  getProfitabilityLevelLabel,
} from "../utils/platformBillingFormatters";

interface TenantCommercialSummaryCardProps {
  tenantId: string;
  onManageEntitlements?: () => void;
}

export function TenantCommercialSummaryCard({
  tenantId,
  onManageEntitlements,
}: TenantCommercialSummaryCardProps) {
  const { data: entitlements, isLoading, isError } =
    usePlatformTenantEntitlements(tenantId);

  const copy = platformCopy.tenants.commercial;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        {onManageEntitlements ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onManageEntitlements}
          >
            {copy.manageCta}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : isError || !entitlements ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title={copy.unavailable}
            size="sm"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {platformCopy.tenants.entitlements.levelBadge(
                  entitlements.profitabilityLevel,
                )}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getProfitabilityLevelLabel(entitlements.profitabilityLevel)}
              </span>
              <span className="text-xs text-muted-foreground">
                {platformCopy.tenants.entitlements.effectiveCount(
                  entitlements.effectiveModuleCodes.length,
                )}
              </span>
            </div>

            {entitlements.directEntitlements.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {entitlements.directEntitlements.map((item) => (
                  <li
                    key={item.moduleCode}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.moduleName}</p>
                          <Badge variant="outline">
                            {copy.kindLabels[item.kind] ?? item.kind}
                          </Badge>
                          {item.priceTier === "ea" ? (
                            <Badge variant="secondary">{copy.eaBadge}</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.moduleCode}
                        </p>
                        {item.memberCodes.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {platformCopy.tenants.entitlements.includesMembers(
                              item.memberCodes.length,
                            )}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {formatBillingPriceCents(item.priceLockedCents)}
                        <span className="text-xs font-normal text-muted-foreground">
                          {copy.perMonth}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Package className="h-10 w-10" />}
                title={copy.noModules.title}
                description={copy.noModules.description}
                size="sm"
              />
            )}

            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">{copy.totalsSection}</p>
              <InfoRow
                variant="inline"
                label={copy.totals.plan}
                value={formatBillingPriceCents(
                  entitlements.commercialSummary.planMonthlyPriceCents,
                )}
              />
              <InfoRow
                variant="inline"
                label={copy.totals.modules}
                value={formatBillingPriceCents(
                  entitlements.commercialSummary.modulesTotalCents,
                )}
              />
              {entitlements.commercialSummary.overageTotalCents > 0 ? (
                <InfoRow
                  variant="inline"
                  label={copy.totals.overage}
                  value={formatBillingPriceCents(
                    entitlements.commercialSummary.overageTotalCents,
                  )}
                />
              ) : null}
              <InfoRow
                variant="inline"
                label={copy.totals.subtotal}
                value={formatBillingPriceCents(
                  entitlements.commercialSummary.subtotalCents,
                )}
              />
              <InfoRow
                variant="inline"
                label={copy.totals.iva}
                value={formatBillingPriceCents(entitlements.commercialSummary.ivaCents)}
              />
              <div className="border-t pt-3">
                <InfoRow
                  variant="inline"
                  label={copy.totals.estimatedTotal}
                  value={formatBillingPriceCents(
                    entitlements.commercialSummary.estimatedTotalCents,
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">{copy.disclaimer}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
