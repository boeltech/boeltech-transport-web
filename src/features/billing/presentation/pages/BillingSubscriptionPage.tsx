import {
  Building2,
  CreditCard,
  Mail,
  Package,
  Receipt,
  Stamp,
  Users,
} from "lucide-react";
import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { StatCard } from "@shared/ui/data-display/StatCard";
import { EmptyState } from "@shared/ui/feedback-states";
import { Progress } from "@shared/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  useBillingEntitlements,
  useBillingSubscription,
  useBillingUsage,
} from "../../application/hooks/useBilling";
import { useBranches } from "@features/branches";
import { BranchOverQuotaBanner } from "@features/branches/presentation/components/BranchOverQuotaBanner";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
  formatHistoryMonths,
  formatLimitValue,
  formatModuleActivatedAt,
  getBillingCycleLabel,
  getModuleKindLabel,
  getQuotaPolicyDescription,
  getQuotaPolicyLabel,
  getStampUsageTone,
  getSubscriptionStatusLabel,
} from "../utils/billingFormatters";
import {
  computeStampUsagePercent,
  resolveStampUsageAlertLevel,
} from "../utils/stampUsageThresholds";

export function BillingSubscriptionPage() {
  const copy = billingCopy;
  const subscription = useBillingSubscription();
  const usage = useBillingUsage();
  const entitlements = useBillingEntitlements();
  const { data: branchesResult } = useBranches({
    page: 1,
    limit: 1,
    filters: { isActive: true },
  });

  const sub = subscription.data;
  const use = usage.data;
  const ent = entitlements.data;

  const usagePercent = use
    ? computeStampUsagePercent(use.stampsUsed, use.includedStamps)
    : 0;

  const stampsRemaining = use
    ? Math.max(0, use.includedStamps - use.stampsUsed)
    : 0;

  const stampTone = getStampUsageTone(usagePercent);
  const usageAlertLevel = resolveStampUsageAlertLevel(usagePercent);
  const planName = sub?.planName ?? copy.hero.planFallback;
  const isTrialing = sub?.status === "trialing";
  const trialDateExpired =
    isTrialing &&
    !!sub?.trialEndsAt &&
    new Date(sub.trialEndsAt).getTime() <= Date.now();
  const trialStampsExhausted =
    isTrialing && !!use && use.stampsUsed >= use.includedStamps;

  return (
    <SettingsPageShell sectionTitle={copy.page.sectionTitle}>
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{copy.hero.badge}</Badge>
              {sub ? (
                <Badge variant="outline">{getSubscriptionStatusLabel(sub.status)}</Badge>
              ) : null}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {subscription.isLoading ? copy.hero.title : planName}
              </h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {copy.hero.description}
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {copy.hero.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-lg border bg-background/80 p-3"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold tabular-nums text-primary"
                  >
                    {copy.hero.stepPrefix(index + 1)}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <BranchOverQuotaBanner meta={branchesResult?.meta} />

        {sub && !subscription.isLoading ? (
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title={copy.metrics.monthlyPrice}
                value={formatBillingPriceCents(sub.monthlyPriceCents)}
                description={copy.metrics.monthlyPriceHint}
                tooltip={copy.metrics.monthlyPriceTooltip}
                icon={<CreditCard className="h-5 w-5" />}
              />
              <StatCard
                title={copy.metrics.estimatedTotal}
                value={
                  ent
                    ? formatBillingPriceCents(
                        ent.commercialSummary.estimatedTotalCents,
                      )
                    : "—"
                }
                description={copy.metrics.estimatedTotalHint}
                tooltip={copy.metrics.estimatedTotalTooltip}
                icon={<Receipt className="h-5 w-5" />}
                tone="info"
                isLoading={entitlements.isLoading}
              />
              <StatCard
                title={copy.metrics.users}
                value={formatLimitValue(sub.limits.maxUsers)}
                description={copy.metrics.includedInPlan}
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                title={copy.metrics.branches}
                value={formatLimitValue(sub.limits.maxBranches)}
                description={copy.metrics.includedInPlan}
                icon={<Building2 className="h-5 w-5" />}
              />
            </div>
            {ent ? (
              <p className="text-xs text-muted-foreground">
                <a
                  href="#billing-commercial-summary"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {copy.metrics.estimatedTotalLink}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                {copy.plan.title}
              </CardTitle>
              <CardDescription>{copy.plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscription.isLoading ? (
                <p className="text-sm text-muted-foreground">{copy.plan.loading}</p>
              ) : sub ? (
                <>
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.plan}
                    value={sub.planName}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.status}
                    value={getSubscriptionStatusLabel(sub.status)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.cycle}
                    value={getBillingCycleLabel(sub.billingCycle)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.price}
                    value={formatBillingPriceCents(sub.monthlyPriceCents)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.period}
                    value={`${formatDateTime(sub.currentPeriodStart)} — ${formatDateTime(sub.currentPeriodEnd)}`}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.profitabilityLevel}
                    value={sub.profitabilityLevel}
                  />
                  <p className="text-xs text-muted-foreground">
                    {copy.plan.profitabilityHint}
                  </p>
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.users}
                    value={formatLimitValue(sub.limits.maxUsers)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.branches}
                    value={formatLimitValue(sub.limits.maxBranches)}
                  />
                  <InfoRow
                    variant="inline"
                    label={copy.plan.fields.historyRetention}
                    value={formatHistoryMonths(sub.limits.historyMonths)}
                  />
                  {sub.trialEndsAt ? (
                    <InfoRow
                      variant="inline"
                      label={copy.plan.fields.trial}
                      value={formatDateTime(sub.trialEndsAt)}
                    />
                  ) : null}
                  {sub.status === "trialing" ? (
                    <AlertWithIcon
                      variant="info"
                      title={copy.plan.statusLabels.trialing}
                    >
                      {copy.plan.trialQuotaHint}
                    </AlertWithIcon>
                  ) : null}
                  {trialDateExpired ? (
                    <AlertWithIcon
                      variant="destructive"
                      title={copy.plan.trialExpiredTitle}
                    >
                      {copy.plan.trialExpiredDescription}
                    </AlertWithIcon>
                  ) : null}
                  {trialStampsExhausted && !trialDateExpired ? (
                    <AlertWithIcon
                      variant="destructive"
                      title={copy.plan.trialExhaustedTitle}
                    >
                      {copy.plan.trialExhaustedDescription}
                    </AlertWithIcon>
                  ) : null}
                  {sub.notes ? (
                    <InfoRow
                      variant="inline"
                      label={copy.plan.fields.notes}
                      value={sub.notes}
                    />
                  ) : null}
                </>
              ) : (
                <EmptyState
                  icon={<CreditCard className="h-10 w-10" />}
                  title={copy.plan.empty.title}
                  description={copy.plan.empty.description}
                  size="sm"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Stamp className="h-4 w-4" />
                {copy.stamps.title}
              </CardTitle>
              <CardDescription>{copy.stamps.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usage.isLoading ? (
                <p className="text-sm text-muted-foreground">{copy.stamps.loading}</p>
              ) : use ? (
                <>
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-2xl font-semibold tabular-nums">
                          {copy.stamps.summary(use.stampsUsed, use.includedStamps)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {copy.stamps.remaining(stampsRemaining)}
                        </p>
                        {use.prepaidRemaining > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {copy.stamps.prepaidRemaining(use.prepaidRemaining)}
                          </p>
                        ) : null}
                      </div>
                      <Badge
                        variant={
                          stampTone === "destructive"
                            ? "destructive"
                            : stampTone === "warning"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {copy.stamps.usedPercent(usagePercent)}
                      </Badge>
                    </div>
                    <Progress value={usagePercent} />
                  </div>

                  {usageAlertLevel === "watch" ? (
                    <AlertWithIcon
                      variant="info"
                      title={copy.stamps.usageAlerts.watch.title}
                    >
                      {copy.stamps.usageAlerts.watch.description(stampsRemaining)}
                    </AlertWithIcon>
                  ) : null}
                  {usageAlertLevel === "warning" ? (
                    <AlertWithIcon
                      variant="warning"
                      title={copy.stamps.usageAlerts.warning.title}
                    >
                      {copy.stamps.usageAlerts.warning.description(stampsRemaining)}
                    </AlertWithIcon>
                  ) : null}
                  {usageAlertLevel === "exhausted" ? (
                    <AlertWithIcon
                      variant="destructive"
                      title={copy.stamps.usageAlerts.exhausted.title}
                    >
                      {copy.stamps.usageAlerts.exhausted.description}
                    </AlertWithIcon>
                  ) : null}

                  <InfoRow
                    variant="inline"
                    label={copy.stamps.quotaPolicy}
                    value={getQuotaPolicyLabel(use.quotaPolicy)}
                  />
                  {getQuotaPolicyDescription(use.quotaPolicy) ? (
                    <p className="text-xs text-muted-foreground">
                      {getQuotaPolicyDescription(use.quotaPolicy)}
                    </p>
                  ) : null}

                  {use.overageStamps > 0 ? (
                    <AlertWithIcon variant="warning" title={copy.stamps.overageTitle}>
                      {copy.stamps.overage(
                        use.overageStamps,
                        formatBillingPriceCents(use.overageTotalCents),
                      )}
                    </AlertWithIcon>
                  ) : null}

                  {use.history.length > 0 ? (
                    <div className="space-y-3 border-t pt-4">
                      <div>
                        <p className="text-sm font-medium">{copy.stamps.historyTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {copy.stamps.historyDescription}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{copy.stamps.historyColumns.period}</TableHead>
                              <TableHead>{copy.stamps.historyColumns.used}</TableHead>
                              <TableHead>{copy.stamps.historyColumns.overage}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {use.history.map((item) => (
                              <TableRow key={item.periodKey}>
                                <TableCell>
                                  {formatBillingPeriodKey(item.periodKey)}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {item.stampsUsed}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {item.overageStamps > 0
                                    ? item.overageStamps
                                    : copy.stamps.historyNone}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <ul className="space-y-2 sm:hidden">
                        {use.history.map((item) => (
                          <li
                            key={item.periodKey}
                            className="rounded-md border px-3 py-2 text-sm"
                          >
                            <p className="font-medium">
                              {formatBillingPeriodKey(item.periodKey)}
                            </p>
                            <p className="text-muted-foreground">
                              {item.stampsUsed} {copy.stamps.historyColumns.used.toLowerCase()}
                              {item.overageStamps > 0
                                ? ` · ${copy.stamps.historyColumns.overage.toLowerCase()} ${item.overageStamps}`
                                : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  icon={<Stamp className="h-10 w-10" />}
                  title={copy.stamps.unavailable}
                  size="sm"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {ent && !entitlements.isLoading ? (
          <Card id="billing-commercial-summary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4" />
                {copy.commercial.title}
              </CardTitle>
              <CardDescription>{copy.commercial.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                variant="inline"
                label={copy.commercial.totals.plan}
                value={formatBillingPriceCents(
                  ent.commercialSummary.planMonthlyPriceCents,
                )}
              />
              <InfoRow
                variant="inline"
                label={copy.commercial.totals.modules}
                value={formatBillingPriceCents(
                  ent.commercialSummary.modulesTotalCents,
                )}
              />
              {ent.commercialSummary.overageTotalCents > 0 ? (
                <InfoRow
                  variant="inline"
                  label={copy.commercial.totals.overage}
                  value={formatBillingPriceCents(
                    ent.commercialSummary.overageTotalCents,
                  )}
                />
              ) : null}
              <InfoRow
                variant="inline"
                label={copy.commercial.totals.subtotal}
                value={formatBillingPriceCents(ent.commercialSummary.subtotalCents)}
              />
              <InfoRow
                variant="inline"
                label={copy.commercial.totals.iva}
                value={formatBillingPriceCents(ent.commercialSummary.ivaCents)}
              />
              <InfoRow
                variant="inline"
                label={copy.commercial.totals.estimatedTotal}
                value={formatBillingPriceCents(
                  ent.commercialSummary.estimatedTotalCents,
                )}
              />
              <p className="text-xs text-muted-foreground">
                {copy.commercial.disclaimer}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              {copy.modules.title}
            </CardTitle>
            <CardDescription>{copy.modules.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {entitlements.isLoading ? (
              <p className="text-sm text-muted-foreground">{copy.modules.loading}</p>
            ) : ent && ent.directEntitlements.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {ent.directEntitlements.map((item) => (
                  <li
                    key={item.moduleCode}
                    className="rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.moduleName}</p>
                      <Badge variant="outline">
                        {getModuleKindLabel(item.kind)}
                      </Badge>
                      {item.priceTier === "ea" ? (
                        <Badge variant="secondary">{copy.modules.eaBadge}</Badge>
                      ) : null}
                      <Badge variant="secondary">
                        {copy.modules.statusLabels[item.status] ?? item.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium tabular-nums">
                      {copy.modules.pricePerMonth(
                        formatBillingPriceCents(item.priceLockedCents),
                      )}
                    </p>
                    {item.memberCodes.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {copy.modules.includesMembers(item.memberCodes.length)}
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
                title={copy.modules.empty.title}
                description={copy.modules.empty.description(sub?.planName ?? "")}
                size="sm"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium">{copy.contact.title}</p>
              <p className="text-sm text-muted-foreground">{copy.contact.description}</p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <a href={`mailto:${copy.contact.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                {copy.contact.cta}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </SettingsPageShell>
  );
}
