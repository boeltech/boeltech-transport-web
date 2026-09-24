import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  FlaskConical,
  Wallet,
} from "lucide-react";
import { StatCard } from "@shared/ui/data-display";
import { Badge } from "@shared/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatBillingPriceCents } from "../utils/platformBillingFormatters";
import { usePlatformPulse } from "../../application/hooks/usePlatformTenants";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { platformCopy } from "../copy/platformCopy";
import { TenantHealthDot } from "../components/TenantHealthDot";
import { TenantLifecycleBadge } from "../config/platformLifecycleConfig";
import type { PlatformLifecycleStageType } from "../../domain/entities";

function reasonLabel(code: string): string {
  return platformCopy.pulse.reasonCodes[code] ?? code;
}

export function PlatformPulsePage() {
  const copy = platformCopy.pulse;
  const navigate = useNavigate();
  const { data: pulse, isLoading, isError } = usePlatformPulse();

  const kpis = pulse?.kpis;

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      {isError ? (
        <AlertWithIcon variant="destructive" title={copy.error.title}>
          {copy.error.description}
        </AlertWithIcon>
      ) : null}

      {pulse?.generatedAt ? (
        <p className="text-xs text-muted-foreground">
          {copy.generatedAt(formatDateTime(pulse.generatedAt))}
          {pulse.healthAsOf
            ? ` · ${copy.healthAsOf(formatDateTime(pulse.healthAsOf))}`
            : ` · ${copy.healthPending}`}
        </p>
      ) : null}

      {/* StatCard×4 (no DashboardKpiStrip): drill-down navigate + tone/icon per KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <StatCard
              title={copy.kpis.mrr}
              value="—"
              description={copy.kpis.mrrHint}
              icon={<CircleDollarSign className="h-5 w-5" />}
              tone="success"
              isLoading
            />
            <StatCard
              title={copy.kpis.cxcOverdue}
              value="—"
              description={copy.kpis.cxcOverdueHint}
              icon={<Wallet className="h-5 w-5" />}
              tone="destructive"
              isLoading
            />
            <StatCard
              title={copy.kpis.atRisk}
              value="—"
              description={copy.kpis.atRiskHint}
              icon={<AlertTriangle className="h-5 w-5" />}
              tone="warning"
              isLoading
            />
            <StatCard
              title={copy.kpis.trials}
              value="—"
              description={copy.kpis.trialsHint}
              icon={<FlaskConical className="h-5 w-5" />}
              tone="info"
              isLoading
            />
          </>
        ) : (
          <>
            <button
              type="button"
              className="text-left"
              aria-label={copy.kpis.mrrAria}
              onClick={() => navigate("/platform/tenants")}
            >
              <StatCard
                title={copy.kpis.mrr}
                value={formatBillingPriceCents(kpis?.mrrCents ?? 0)}
                description={copy.kpis.mrrHint}
                icon={<CircleDollarSign className="h-5 w-5" />}
                tone="success"
              />
            </button>
            <button
              type="button"
              className="text-left"
              aria-label={copy.kpis.cxcOverdueAria}
              onClick={() =>
                navigate("/platform/billing/ar?status=open&min_days_overdue=1")
              }
            >
              <StatCard
                title={copy.kpis.cxcOverdue}
                value={formatBillingPriceCents(kpis?.cxcOverdueCents ?? 0)}
                description={copy.kpis.cxcOverdueHint}
                icon={<Wallet className="h-5 w-5" />}
                tone="destructive"
              />
            </button>
            <button
              type="button"
              className="text-left"
              aria-label={copy.kpis.atRiskAria}
              onClick={() => navigate("/platform/tenants?atRisk=true")}
            >
              <StatCard
                title={copy.kpis.atRisk}
                value={kpis?.tenantsAtRisk ?? 0}
                description={copy.kpis.atRiskHint}
                icon={<AlertTriangle className="h-5 w-5" />}
                tone="warning"
              />
            </button>
            <button
              type="button"
              className="text-left"
              aria-label={copy.kpis.trialsAria}
              onClick={() =>
                navigate("/platform/tenants?subscriptionStatus=trialing")
              }
            >
              <StatCard
                title={copy.kpis.trials}
                value={kpis?.trialsActive ?? 0}
                description={copy.kpis.trialsHint}
                icon={<FlaskConical className="h-5 w-5" />}
                tone="info"
              />
            </button>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{copy.queue.title}</CardTitle>
          <CardDescription>{copy.queue.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (pulse?.attentionQueue.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Building2 className="h-10 w-10" />}
              title={copy.queue.empty.title}
              description={copy.queue.empty.description}
              size="sm"
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.queue.columns.tenant}</TableHead>
                      <TableHead>{copy.queue.columns.stage}</TableHead>
                      <TableHead>{copy.queue.columns.health}</TableHead>
                      <TableHead>{copy.queue.columns.reasons}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pulse?.attentionQueue.map((item) => (
                      <TableRow key={item.tenantId}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <Link
                              to={`/platform/tenants/${item.tenantId}`}
                              className="font-medium text-foreground hover:underline"
                            >
                              {item.name}
                            </Link>
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.subdomain}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TenantLifecycleBadge
                            status={
                              item.lifecycleStage as PlatformLifecycleStageType
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TenantHealthDot score={item.healthScore} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.reasonCodes.map((code) => (
                              <Badge
                                key={code}
                                variant="secondary"
                                tone="soft"
                              >
                                {reasonLabel(code)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="space-y-3 md:hidden">
                {pulse?.attentionQueue.map((item) => (
                  <li key={item.tenantId}>
                    <Link
                      to={`/platform/tenants/${item.tenantId}`}
                      className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{item.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.subdomain}
                          </p>
                        </div>
                        <TenantHealthDot score={item.healthScore} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <TenantLifecycleBadge
                          status={
                            item.lifecycleStage as PlatformLifecycleStageType
                          }
                        />
                        {item.reasonCodes.map((code) => (
                          <Badge key={code} variant="secondary" tone="soft">
                            {reasonLabel(code)}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </PlatformPageShell>
  );
}
