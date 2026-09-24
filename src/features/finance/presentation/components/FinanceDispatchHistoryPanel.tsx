/**
 * Historial de corridas de despacho — tab del workbench Envío de facturas (F1).
 * Extraído de FinanceDispatchRunsPage para reutilizarlo bajo WorkbenchPageShell.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useQueryErrorToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { useBillingSchemes } from "@features/settings/application/hooks/useBillingSchemes";
import { formatBillingSchemeCadenceSummary } from "@features/settings/presentation/utils/formatBillingSchemeCadence";
import {
  useBillingDispatchRuns,
  useCreateBillingDispatchRun,
  useFinanceListingFilters,
} from "@features/finance/application";
import {
  DISPATCH_RUN_STATUSES,
  type BillingDispatchRunListItem,
  type DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import {
  DISPATCH_RUNS_PAGE_SIZE,
  FinanceDispatchRunsTable,
} from "./FinanceDispatchRunsTable";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FINANCE_DISPATCH_DETAIL_PATH } from "../../application/financeRoutes";

const copy = dispatchRunsCopy.tab;
const createCopy = dispatchRunsCopy.tab.createDialog;
const emptyCopy = dispatchRunsCopy.tab.empty;

function parseDispatchRunStatus(
  value: string | undefined,
): DispatchRunStatus | undefined {
  if (!value) return undefined;
  return (DISPATCH_RUN_STATUSES as readonly string[]).includes(value)
    ? (value as DispatchRunStatus)
    : undefined;
}

function DispatchRunsOnboardingChecklist() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{emptyCopy.onboardingTitle}</CardTitle>
        <CardDescription>{emptyCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          {emptyCopy.onboardingSteps.map((step) => (
            <li key={step.label}>
              <span className="text-foreground">{step.label}</span>
              {step.href && step.linkLabel ? (
                <>
                  {" "}
                  <Link
                    to={step.href}
                    className="text-primary underline underline-offset-2"
                  >
                    {step.linkLabel}
                  </Link>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function FinanceDispatchHistoryPanel() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("invoices", "execute");

  const { data: schemes = [] } = useBillingSchemes({ isActive: true });
  const activeSchemes = useMemo(
    () => schemes.filter((scheme) => scheme.isActive),
    [schemes],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [schemeId, setSchemeId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedScheme = useMemo(
    () => activeSchemes.find((scheme) => scheme.id === schemeId) ?? null,
    [activeSchemes, schemeId],
  );

  const selectedSchemeCadenceSummary = selectedScheme
    ? formatBillingSchemeCadenceSummary(selectedScheme)
    : null;

  const createMutation = useCreateBillingDispatchRun();

  const filters = useFinanceListingFilters<"status" | "billingSchemeId">({
    filters: {
      status: { paramName: "dispatch_status" },
      billingSchemeId: { paramName: "billing_scheme_id" },
    },
    chipLabels: {
      status: (value) =>
        copy.filters.chipStatus(
          dispatchRunsCopy.status[value as DispatchRunStatus] ?? value,
        ),
      billingSchemeId: (value) =>
        copy.filters.chipScheme(
          schemes.find((s) => s.id === value)?.name ?? value,
        ),
    },
  });

  const statusFilter = parseDispatchRunStatus(filters.filters.status);
  const schemeFilter = filters.filters.billingSchemeId || undefined;

  useEffect(() => {
    if (filters.filters.status && !statusFilter) {
      filters.setFilter("status", "");
    }
  }, [filters.filters.status, statusFilter, filters.setFilter]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useBillingDispatchRuns({
      page: filters.page,
      limit: DISPATCH_RUNS_PAGE_SIZE,
      status: statusFilter,
      billingSchemeId: schemeFilter,
    });

  const runs = data?.data ?? [];
  const showOnboarding =
    !isLoading && !filters.hasFilters && runs.length === 0;

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadError,
  });

  const schemeName = useCallback(
    (id: string | null) =>
      id ? schemes.find((s) => s.id === id)?.name ?? id : "—",
    [schemes],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleView = useCallback(
    (id: string) => {
      navigate(FINANCE_DISPATCH_DETAIL_PATH(id));
    },
    [navigate],
  );

  const handleOpenCreate = useCallback(() => {
    setCreateError(null);
    setSchemeId(activeSchemes.length === 1 ? activeSchemes[0]!.id : "");
    setCreateOpen(true);
  }, [activeSchemes]);

  const handleCreateDialogOpenChange = useCallback((open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setCreateError(null);
      setSchemeId("");
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!schemeId) return;
    setCreateError(null);
    try {
      const run = await createMutation.mutateAsync({
        billingSchemeId: schemeId,
        autoPreview: true,
      });
      setCreateOpen(false);
      navigate(FINANCE_DISPATCH_DETAIL_PATH(run.id), { replace: true });
    } catch {
      setCreateError(dispatchRunsCopy.toast.error);
    }
  }, [createMutation, navigate, schemeId]);

  return (
    <>
      <ListPageShell<BillingDispatchRunListItem>
        showHeader={false}
        title={copy.title}
        description={copy.subtitle}
        beforeToolbar={
          <div className="space-y-6">
            {canExecute ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={handleOpenCreate}
                >
                  {copy.executeCta}
                </Button>
              </div>
            ) : null}
            {showOnboarding ? <DispatchRunsOnboardingChecklist /> : null}
          </div>
        }
        toolbar={{
          filters: (
            <>
              <Select
                value={statusFilter ?? "all"}
                onValueChange={(value) =>
                  filters.setFilter("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger
                  className="w-44"
                  aria-label={copy.filters.statusPlaceholder}
                >
                  <SelectValue placeholder={copy.filters.statusPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.all}</SelectItem>
                  {DISPATCH_RUN_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {dispatchRunsCopy.status[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={schemeFilter ?? "all"}
                onValueChange={(value) =>
                  filters.setFilter(
                    "billingSchemeId",
                    value === "all" ? "" : value,
                  )
                }
              >
                <SelectTrigger
                  className="w-52"
                  aria-label={copy.filters.schemePlaceholder}
                >
                  <SelectValue placeholder={copy.filters.schemePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.all}</SelectItem>
                  {schemes.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
        }}
        isLoading={isLoading}
        items={runs}
        pagination={
          data?.pagination
            ? {
                page: filters.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit ?? DISPATCH_RUNS_PAGE_SIZE,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        entityLabelPlural={copy.entityLabelPlural}
        renderTable={() => (
          <FinanceDispatchRunsTable
            runs={runs}
            isLoading={isLoading}
            schemeName={schemeName}
            onView={handleView}
          />
        )}
        emptyState={{
          icon: <History className="h-10 w-10 text-muted-foreground" />,
          title: copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.withFilters
            : copy.empty.description,
          cta:
            canExecute && !filters.hasFilters
              ? {
                  label: copy.executeCta,
                  icon: <Plus className="h-4 w-4" />,
                  onClick: handleOpenCreate,
                }
              : undefined,
          secondaryCta: filters.hasFilters
            ? {
                label: copy.empty.clearFilters,
                onClick: filters.clearAll,
                variant: "outline",
              }
            : {
                label: copy.empty.settingsLink,
                onClick: () => navigate("/settings/billing-schemes"),
                variant: "outline",
              },
        }}
      />

      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createCopy.title}</DialogTitle>
            <DialogDescription>{createCopy.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dispatch-send-type">{createCopy.schemeLabel}</Label>
              <Select
                value={schemeId}
                disabled={createMutation.isPending || activeSchemes.length === 0}
                onValueChange={setSchemeId}
              >
                <SelectTrigger id="dispatch-send-type">
                  <SelectValue placeholder={createCopy.schemeLabel} />
                </SelectTrigger>
                <SelectContent>
                  {activeSchemes.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{createCopy.schemeHint}</p>
              {selectedSchemeCadenceSummary ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {createCopy.schemeSummaryLabel}:{" "}
                  </span>
                  {selectedSchemeCadenceSummary}
                </p>
              ) : null}
            </div>

            {activeSchemes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {createCopy.noSchemes}{" "}
                <Link
                  to="/settings/billing-schemes"
                  className="text-primary underline underline-offset-2"
                >
                  {createCopy.settingsLink}
                </Link>
                .
              </p>
            ) : null}

            {createError ? (
              <Alert variant="destructive">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setCreateOpen(false)}
            >
              {createCopy.cancel}
            </Button>
            <Button
              type="button"
              disabled={
                !schemeId || createMutation.isPending || activeSchemes.length === 0
              }
              onClick={() => void handleCreate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {createCopy.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
