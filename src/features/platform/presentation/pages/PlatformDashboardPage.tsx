import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  Database,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { StatCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { AlertWithIcon } from "@shared/ui/alert";
import { EmptyState } from "@shared/ui/feedback-states";
import { Progress } from "@shared/ui/progress";
import {
  usePlatformMetrics,
  usePlatformPlans,
} from "../../application/hooks/usePlatformTenants";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "../utils/formatPlanLabel";

export function PlatformDashboardPage() {
  const copy = platformCopy.dashboard;
  const { data: metrics, isLoading, isError } = usePlatformMetrics();
  const { data: plans } = usePlatformPlans();

  const planRows = useMemo(() => {
    if (!metrics) return [];

    const entries = Object.entries(metrics.tenantsByPlan).sort(
      ([, left], [, right]) => right - left,
    );
    const totalAssigned = entries.reduce((sum, [, count]) => sum + count, 0);

    return entries.map(([planCode, count]) => ({
      planCode,
      label: resolvePlanDisplayName(planCode, plans),
      count,
      sharePercent:
        totalAssigned > 0 ? Math.round((count / totalAssigned) * 100) : 0,
    }));
  }, [metrics, plans]);

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      {isError ? (
        <AlertWithIcon variant="destructive" title={copy.error.title}>
          {copy.error.description}
        </AlertWithIcon>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title={copy.cards.totalTenants}
              value={metrics?.totalTenants ?? 0}
              description={copy.cards.totalTenantsHint}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              title={copy.cards.activeTenants}
              value={metrics?.activeTenants ?? 0}
              description={copy.cards.activeTenantsHint}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="success"
            />
            <StatCard
              title={copy.cards.suspendedTenants}
              value={metrics?.suspendedTenants ?? 0}
              description={copy.cards.suspendedTenantsHint}
              icon={<Building2 className="h-5 w-5" />}
              tone="warning"
            />
            <StatCard
              title={copy.cards.totalUsers}
              value={metrics?.totalUsers ?? 0}
              description={copy.cards.totalUsersHint}
              icon={<Users className="h-5 w-5" />}
              tone="info"
            />
            <StatCard
              title={copy.cards.newTenants}
              value={metrics?.tenantsCreatedLast30Days ?? 0}
              description={copy.cards.newTenantsHint}
              icon={<UserPlus className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{copy.plans.title}</CardTitle>
            <CardDescription>{copy.plans.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : planRows.length > 0 ? (
              <ul className="space-y-3">
                {planRows.map((row) => (
                  <li
                    key={row.planCode}
                    className="rounded-lg border px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{row.label}</p>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {copy.plans.tenantCount(row.count)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{copy.plans.columns.share}</span>
                        <span>{row.sharePercent}%</span>
                      </div>
                      <Progress value={row.sharePercent} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Building2 className="h-10 w-10" />}
                title={copy.plans.empty.title}
                description={copy.plans.empty.description}
                size="sm"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.quickLinks.title}</CardTitle>
            <CardDescription>{copy.quickLinks.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3"
              asChild
            >
              <Link to="/platform/tenants">
                <Building2 className="mr-3 h-5 w-5 shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">
                    {copy.quickLinks.tenants.label}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {copy.quickLinks.tenants.description}
                  </span>
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3"
              asChild
            >
              <Link to="/platform/audit">
                <ClipboardList className="mr-3 h-5 w-5 shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">
                    {copy.quickLinks.audit.label}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {copy.quickLinks.audit.description}
                  </span>
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto w-full justify-start px-4 py-3"
              asChild
            >
              <Link to="/platform/catalogs">
                <Database className="mr-3 h-5 w-5 shrink-0" />
                <span className="text-left">
                  <span className="block text-sm font-medium">
                    {copy.quickLinks.catalogs.label}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {copy.quickLinks.catalogs.description}
                  </span>
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PlatformPageShell>
  );
}
