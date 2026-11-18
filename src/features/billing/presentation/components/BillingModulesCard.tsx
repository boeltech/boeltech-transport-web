import { ArrowRight, Package, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@features/auth";
import { useCompanySettings } from "@features/settings";
import { EntitlementBadge } from "@shared/ui/entitlement-badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { usePermissions } from "@shared/permissions";
import type {
  BillingAvailableModule,
  BillingEntitlementItem,
  BillingEntitlements,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { buildGpsActivationMailto } from "../utils/buildGpsActivationMailto";
import {
  formatBillingPriceCents,
  formatModuleActivatedAt,
  getProfitabilityLevelDetail,
} from "../utils/billingFormatters";

/** Vista de rentabilidad de viajes; la ruta /finance vive bajo el módulo `invoices`. */
const PROFITABILITY_ROUTE = "/finance/analysis?view=margin";
const FLEET_MAP_ROUTE = "/monitoring/fleet";
const GPS_TRACKING_CODE = "gps_tracking";

interface BillingModulesCardProps {
  entitlements?: BillingEntitlements;
  isLoading: boolean;
  planName?: string | null;
  profitabilityLevel?: string | null;
}

export function BillingModulesCard({
  entitlements,
  isLoading,
  planName: _planName,
  profitabilityLevel,
}: BillingModulesCardProps) {
  const copy = billingCopy.modules;
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const canRequestActivation = hasPermission("billing", "update");

  const companyQuery = useCompanySettings({
    enabled: canRequestActivation,
  });

  const level = profitabilityLevel ?? entitlements?.profitabilityLevel ?? null;
  const levelDetail = level ? getProfitabilityLevelDetail(level) : null;
  const activeModules = entitlements?.directEntitlements ?? [];
  const availableModules = entitlements?.availableModules ?? [];
  const hasActives = activeModules.length > 0;
  const hasAvailable = availableModules.length > 0;
  /** Con solo disponibles (artboard Suscripción): copy empty.description. */
  const cardDescription = hasActives
    ? copy.description
    : hasAvailable
      ? copy.empty.description
      : copy.description;

  const mailtoHref =
    canRequestActivation && user
      ? buildGpsActivationMailto({
          companyName: user.getTenantName() ?? "Empresa",
          rfc: companyQuery.data?.rfc ?? null,
          userName: user.getFullName() ?? "Usuario",
          userEmail: user.email ?? "",
        })
      : null;

  return (
    <Card data-testid="billing-modules-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
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
        ) : !hasActives && !hasAvailable ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title={copy.empty.title}
            description={copy.empty.description}
            size="sm"
          />
        ) : (
          <ul className="grid gap-3">
            {activeModules.map((item) => (
              <ActiveModuleRow key={item.moduleCode} item={item} copy={copy} />
            ))}
            {availableModules.map((item) => (
              <AvailableModuleRow
                key={item.code}
                item={item}
                copy={copy}
                canRequest={canRequestActivation}
                mailtoHref={
                  item.code === GPS_TRACKING_CODE ? mailtoHref : null
                }
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type ModulesCopy = typeof billingCopy.modules;

function ActiveModuleRow({
  item,
  copy,
}: {
  item: BillingEntitlementItem;
  copy: ModulesCopy;
}) {
  const isGps = item.moduleCode === GPS_TRACKING_CODE;

  return (
    <li
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
      data-testid={`billing-module-active-${item.moduleCode}`}
    >
      <div className="flex min-w-0 gap-3">
        <ModuleIcon muted={false} />
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.moduleName}</p>
            <EntitlementBadge variant="active">
              {copy.activeBadge}
            </EntitlementBadge>
            {item.priceTier === "ea" ? (
              <EntitlementBadge variant="early_access">
                {copy.eaBadge}
              </EntitlementBadge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatModuleActivatedAt(item.activatedAt)}
            {isGps ? (
              <>
                {" · "}
                <Link
                  to={FLEET_MAP_ROUTE}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {copy.openFleetMap}
                </Link>
              </>
            ) : null}
          </p>
          {item.memberCodes.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {copy.includesMembers(item.memberCodes.length)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <p className="text-sm font-semibold tabular-nums">
          {copy.pricePerMonth(formatBillingPriceCents(item.priceLockedCents))}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {copy.priceFrozenCaption}
        </p>
      </div>
    </li>
  );
}

function AvailableModuleRow({
  item,
  copy,
  canRequest,
  mailtoHref,
}: {
  item: BillingAvailableModule;
  copy: ModulesCopy;
  canRequest: boolean;
  mailtoHref: string | null;
}) {
  const isGps = item.code === GPS_TRACKING_CODE;

  return (
    <li
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
      data-testid={`billing-module-available-${item.code}`}
    >
      <div className="flex min-w-0 gap-3">
        <ModuleIcon muted />
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.name}</p>
            <EntitlementBadge variant="available">
              {copy.availableBadge}
            </EntitlementBadge>
          </div>
          {isGps ? (
            <p className="text-sm text-muted-foreground">
              {copy.availableBlurb}
              {canRequest ? (
                <>
                  {" "}
                  <Link
                    to={FLEET_MAP_ROUTE}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {copy.learnMore}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 self-start">
        {canRequest && mailtoHref ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={mailtoHref}
              data-testid={`billing-module-request-${item.code}`}
            >
              {copy.requestActivation}
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.requestByAdmin}</p>
        )}
      </div>
    </li>
  );
}

function ModuleIcon({ muted }: { muted: boolean }) {
  return (
    <span
      className={
        muted
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success-soft text-success-soft-foreground"
      }
      aria-hidden
    >
      <Radio className="h-4 w-4" />
    </span>
  );
}
