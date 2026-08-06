import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Wallet } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import {
  PLATFORM_SAAS_INVOICE_STATUS_VALUES,
  isPlatformOwner,
  type PlatformSaasArRow,
  type PlatformSaasInvoiceStatusType,
} from "../../domain/entities";
import { usePlatformArList } from "../../application/hooks/usePlatformSaasAr";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import {
  getLastClosedMexicoCityPeriodKey,
  isClosedBillingPeriodKey,
  isValidBillingPeriodKey,
} from "../utils/billingPeriod";
import { ArTenantFilter } from "../components/ArTenantFilter";
import { IssueSaasInvoiceSheet } from "../components/IssueSaasInvoiceSheet";
import { MarkSaasInvoicePaidSheet } from "../components/MarkSaasInvoicePaidSheet";
import { VoidSaasInvoiceDialog } from "../components/VoidSaasInvoiceDialog";

type ArView = "pending" | "overdue" | "all";

function resolveArView(
  statusParam: string,
  minOverdueParam: string,
  viewParam: string,
): ArView {
  // UI-only `view=all` — distinct from bare URL (which seeds Pendientes).
  if (viewParam === "all") return "all";
  const minOverdue = Number(minOverdueParam);
  if (Number.isFinite(minOverdue) && minOverdue >= 1) return "overdue";
  if (statusParam === "open") return "pending";
  if (!statusParam) return "all";
  return "all";
}

export function PlatformArLedgerPage() {
  const copy = platformCopy.ar;
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status") || "";
  const periodKeyParam = searchParams.get("period_key") || "";
  const tenantIdParam = searchParams.get("tenant_id") || "";
  const minOverdueParam = searchParams.get("min_days_overdue") || "";
  const viewParam = searchParams.get("view") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  // D2: bare entry → Pendientes (`status=open`).
  // Do NOT re-seed when the user chose Todos (`view=all`).
  useEffect(() => {
    if (searchParams.get("view") === "all") return;
    const bareEntry =
      !searchParams.has("status") &&
      !searchParams.has("min_days_overdue") &&
      !searchParams.has("period_key") &&
      !searchParams.has("tenant_id") &&
      !searchParams.has("page") &&
      !searchParams.has("view");
    if (!bareEntry) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("status", "open");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const activeView = resolveArView(statusParam, minOverdueParam, viewParam);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 25,
      status: (PLATFORM_SAAS_INVOICE_STATUS_VALUES as string[]).includes(
        statusParam,
      )
        ? (statusParam as PlatformSaasInvoiceStatusType)
        : undefined,
      periodKey: periodKeyParam || undefined,
      tenantId: tenantIdParam || undefined,
      minDaysOverdue: minOverdueParam
        ? Number(minOverdueParam)
        : undefined,
    }),
    [page, statusParam, periodKeyParam, tenantIdParam, minOverdueParam],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    usePlatformArList(queryParams);

  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  const [issueTenantId, setIssueTenantId] = useState<string | null>(null);
  const [payRow, setPayRow] = useState<PlatformSaasArRow | null>(null);
  const [voidRow, setVoidRow] = useState<PlatformSaasArRow | null>(null);

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  const setView = (view: ArView) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("page");
      if (view === "pending") {
        next.set("status", "open");
        next.delete("min_days_overdue");
        next.delete("view");
      } else if (view === "overdue") {
        next.set("status", "open");
        next.set("min_days_overdue", "1");
        next.delete("view");
      } else {
        // Todos: sin filtro de estado; `view=all` evita que el seed
        // de Pendientes vuelva a forzar status=open.
        next.delete("status");
        next.delete("min_days_overdue");
        next.set("view", "all");
      }
      return next;
    });
  };

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      {!canMutate ? (
        <AlertWithIcon
          className="mb-4"
          variant="info"
          title={copy.readOnlyAlert}
        />
      ) : null}

      <AlertWithIcon
        className="mb-4"
        variant="info"
        title={copy.closeHint}
      />

      <ListPageShell
        title={copy.title}
        showHeader={false}
        entityLabelPlural={copy.entityLabelPlural}
        items={rows}
        isLoading={isLoading}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
              }
            : undefined
        }
        onPageChange={(nextPage) => setParam("page", String(nextPage))}
        toolbar={{
          onRefresh: () => {
            void refetch().then(() =>
              toast({ title: copy.refreshToast, variant: "success" }),
            );
          },
          isRefreshing: isFetching,
          extraActions:
            canMutate && tenantIdParam ? (
              <Button
                size="sm"
                onClick={() => setIssueTenantId(tenantIdParam)}
              >
                {copy.actions.issue}
              </Button>
            ) : undefined,
          filters: (
            <div className="flex flex-col gap-3">
              <div
                className="flex flex-wrap gap-1"
                role="group"
                aria-label="Vista de cobros"
              >
                {(
                  [
                    ["pending", copy.views.pending],
                    ["overdue", copy.views.overdue],
                    ["all", copy.views.all],
                  ] as const
                ).map(([view, label]) => (
                  <Button
                    key={view}
                    type="button"
                    size="sm"
                    variant={activeView === view ? "default" : "outline"}
                    className={cn(activeView === view && "pointer-events-none")}
                    aria-pressed={activeView === view}
                    onClick={() => setView(view)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Input
                  className="w-[130px]"
                  placeholder={copy.filters.periodKeyPlaceholder}
                  aria-label={copy.filters.periodKey}
                  value={periodKeyParam}
                  onChange={(e) => setParam("period_key", e.target.value)}
                />
                <ArTenantFilter
                  value={tenantIdParam}
                  onChange={(id) => setParam("tenant_id", id)}
                />
              </div>
            </div>
          ),
        }}
        emptyState={{
          icon: <Wallet className="h-10 w-10" />,
          title: isError ? copy.error.title : copy.empty.title,
          description: isError
            ? copy.error.description
            : copy.empty.description,
        }}
        renderTable={() => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.columns.tenant}</TableHead>
                <TableHead>{copy.columns.period}</TableHead>
                <TableHead>{copy.columns.status}</TableHead>
                <TableHead>{copy.columns.total}</TableHead>
                <TableHead>{copy.columns.dueAndOverdue}</TableHead>
                <TableHead>{copy.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const isOverdue =
                  row.status === "open" && row.daysOverdue > 0;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        className="font-medium text-primary underline-offset-2 hover:underline"
                        to={`/platform/tenants/${row.tenantId}`}
                      >
                        {row.tenantName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {row.subdomain}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatBillingPeriodKey(row.periodKey)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone="soft"
                        variant={
                          row.status === "open"
                            ? "warning"
                            : row.status === "paid"
                              ? "success"
                              : "secondary"
                        }
                      >
                        {copy.status[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatBillingPriceCents(row.totalCents)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>
                          {row.dueDate ? formatDate(row.dueDate) : "—"}
                        </span>
                        {isOverdue ? (
                          <Badge tone="soft" variant="warning" className="w-fit">
                            {copy.card.daysOverdue(row.daysOverdue)}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canMutate && row.status === "open" ? (
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            onClick={() => setPayRow(row)}
                          >
                            {copy.actions.markPaid}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setVoidRow(row)}
                          >
                            {copy.actions.void}
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      />

      {canMutate && issueTenantId ? (
        <IssueSaasInvoiceSheet
          tenantId={issueTenantId}
          open
          onOpenChange={(open) => {
            if (!open) setIssueTenantId(null);
          }}
          defaultPeriodKey={
            periodKeyParam &&
            isValidBillingPeriodKey(periodKeyParam) &&
            isClosedBillingPeriodKey(periodKeyParam)
              ? periodKeyParam
              : getLastClosedMexicoCityPeriodKey()
          }
        />
      ) : null}
      <MarkSaasInvoicePaidSheet
        invoice={payRow}
        open={!!payRow}
        onOpenChange={(open) => {
          if (!open) setPayRow(null);
        }}
      />
      <VoidSaasInvoiceDialog
        invoice={voidRow}
        open={!!voidRow}
        onOpenChange={(open) => {
          if (!open) setVoidRow(null);
        }}
      />
    </PlatformPageShell>
  );
}
