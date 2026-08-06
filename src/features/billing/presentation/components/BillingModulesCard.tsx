import { ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { usePermissions } from "@shared/permissions";
import type { BillingEntitlements } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPriceCents,
  formatModuleActivatedAt,
  getProfitabilityLevelDetail,
} from "../utils/billingFormatters";

/** Vista de rentabilidad de viajes; la ruta /finance vive bajo el módulo `invoices`. */
const PROFITABILITY_ROUTE = "/finance?tab=analysis&view=margin";

interface BillingModulesCardProps {
  entitlements?: BillingEntitlements;
  isLoading: boolean;
  planName?: string | null;
  profitabilityLevel?: string | null;
}

export function BillingModulesCard({
  entitlements,
  isLoading,
  planName,
  profitabilityLevel,
}: BillingModulesCardProps) {
  const copy = billingCopy.modules;
  const { hasPermission } = usePermissions();

  const level = profitabilityLevel ?? entitlements?.profitabilityLevel ?? null;
  const levelDetail = level ? getProfitabilityLevelDetail(level) : null;
  const modules = entitlements?.directEntitlements ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {level && levelDetail ? (
          <div className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.level.label}
            </p>
            <p className="text-sm font-semibold">{levelDetail.label}</p>
            {levelDetail.includes ? (
              <p className="text-sm text-muted-foreground">
                {levelDetail.includes}
              </p>
            ) : null}
            {hasPermission("invoices", "read") ? (
              <Link
                to={PROFITABILITY_ROUTE}
                className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {copy.level.profitabilityLink}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : modules.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {modules.map((item) => (
              <li
                key={item.moduleCode}
                className="rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.moduleName}</p>
                  {item.priceTier === "ea" ? (
                    <Badge variant="info" tone="soft">
                      {copy.eaBadge}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium tabular-nums">
                  {copy.pricePerMonth(
                    formatBillingPriceCents(item.priceLockedCents),
                  )}
                </p>
                {item.memberCodes.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {copy.includesMembers(item.memberCodes.length)}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatModuleActivatedAt(item.activatedAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title={copy.empty.title}
            description={copy.empty.description(planName ?? "")}
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
