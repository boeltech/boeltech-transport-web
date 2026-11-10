import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { TemplateAssignmentBatchSheet } from "@features/compensation/presentation";
import {
  useOperatorPaymentReadiness,
} from "../../application/hooks";
import type { OperatorPaymentAttentionFilter } from "../../domain/enums";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import { OperatorPaymentsAttentionChips } from "../components/OperatorPaymentsAttentionChips";
import { OperatorPaymentsTable } from "../components/OperatorPaymentsTable";
import { OperatorPaymentReadinessPanel } from "../components/OperatorPaymentReadinessPanel";
import { OperatorAssignTariffPicker } from "../components/OperatorAssignTariffPicker";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList;
const PAGE_SIZE = 25;

/**
 * List Operadores + panel readiness 3 pasos (F3 / PRD CA F3.1–F3.5).
 * HB-T5: solo `hasClabe` — nunca CLABE completa.
 */
export function OperatorPaymentsOperatorsPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canAssign = hasPermission("settlements", "update");

  const filters = useListingFilters({
    filters: {},
  });

  const [attention, setAttention] =
    useState<OperatorPaymentAttentionFilter | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [batchTemplateId, setBatchTemplateId] = useState<string | null>(null);
  const [batchEmployeeIds, setBatchEmployeeIds] = useState<string[]>([]);

  const attentionProbe = useOperatorPaymentReadiness({
    attention: "needs_attention",
    page: 1,
    pageSize: 1,
    enabled: attention === null,
  });

  useEffect(() => {
    if (attention !== null) return;
    if (!attentionProbe.isSuccess) return;
    const needsAttention = (attentionProbe.data?.pagination.total ?? 0) > 0;
    setAttention(needsAttention ? "needs_attention" : "all");
  }, [attention, attentionProbe.isSuccess, attentionProbe.data?.pagination.total]);

  const resolvedAttention: OperatorPaymentAttentionFilter =
    attention ?? "needs_attention";

  const listQuery = useOperatorPaymentReadiness({
    attention: resolvedAttention,
    page: filters.page,
    pageSize: PAGE_SIZE,
    enabled: attention !== null,
  });

  const countAll = useOperatorPaymentReadiness({
    attention: "all",
    page: 1,
    pageSize: 1,
    enabled: attention !== null,
  });
  const countReady = useOperatorPaymentReadiness({
    attention: "ready",
    page: 1,
    pageSize: 1,
    enabled: attention !== null,
  });
  const countAttention = useOperatorPaymentReadiness({
    attention: "needs_attention",
    page: 1,
    pageSize: 1,
    enabled: attention !== null,
  });

  const operators = useMemo(
    () => listQuery.data?.data ?? [],
    [listQuery.data?.data],
  );

  const filteredOperators = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((row) => row.fullName.toLowerCase().includes(q));
  }, [operators, filters.search]);

  useEffect(() => {
    if (filteredOperators.length === 0) {
      setSelectedId(null);
      return;
    }
    if (
      selectedId &&
      filteredOperators.some((row) => row.employeeId === selectedId)
    ) {
      return;
    }
    setSelectedId(filteredOperators[0]!.employeeId);
  }, [filteredOperators, selectedId]);

  const selectedOperator: OperatorPaymentReadiness | null = useMemo(() => {
    if (!selectedId) return null;
    return filteredOperators.find((row) => row.employeeId === selectedId) ?? null;
  }, [filteredOperators, selectedId]);

  const showLoadError = listQuery.isError && !listQuery.isLoading && attention !== null;
  const isBootstrapping = attention === null;

  const handleAttentionChange = useCallback(
    (next: OperatorPaymentAttentionFilter) => {
      setAttention(next);
      filters.setPage(1);
    },
    [filters],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      listQuery.refetch(),
      countAll.refetch(),
      countReady.refetch(),
      countAttention.refetch(),
    ]);
    toast({ title: settlementsCopy.toasts.dataRefreshed, variant: "success" });
  }, [listQuery, countAll, countReady, countAttention, toast]);

  const openBatchAssign = useCallback((employeeIds: string[] = []) => {
    setBatchEmployeeIds(employeeIds);
    setPickerOpen(true);
  }, []);

  const handlePickTemplate = useCallback((templateId: string) => {
    setBatchTemplateId(templateId);
  }, []);

  const handleBatchSuccess = useCallback(() => {
    setBatchTemplateId(null);
    setBatchEmployeeIds([]);
    void listQuery.refetch();
    void countAll.refetch();
    void countReady.refetch();
    void countAttention.refetch();
  }, [listQuery, countAll, countReady, countAttention]);

  const chipCounts = useMemo(
    () => ({
      all: countAll.data?.pagination.total,
      ready: countReady.data?.pagination.total,
      needs_attention: countAttention.data?.pagination.total,
    }),
    [
      countAll.data?.pagination.total,
      countReady.data?.pagination.total,
      countAttention.data?.pagination.total,
    ],
  );

  const pagination =
    !showLoadError && listQuery.data?.pagination
      ? {
          page: filters.page,
          totalPages: listQuery.data.pagination.totalPages,
          total: listQuery.data.pagination.total,
          limit: listQuery.data.pagination.limit,
        }
      : undefined;

  return (
    <>
      <ListPageShell
        showHeader
        title={copy.title}
        description={copy.description}
        primaryAction={
          canAssign
            ? {
                label: copy.assignBatch,
                onClick: () => openBatchAssign([]),
                icon: <Users className="mr-2 h-4 w-4" />,
              }
            : undefined
        }
        beforeToolbar={
          showLoadError ? (
            <DetailAlertCard
              severity="critical"
              title={copy.loadErrorTitle}
              action={
                <Button type="button" variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                  {copy.retry}
                </Button>
              }
            >
              <p>{copy.loadError}</p>
            </DetailAlertCard>
          ) : null
        }
        items={filteredOperators}
        isLoading={isBootstrapping || listQuery.isLoading || showLoadError}
        pagination={pagination}
        onPageChange={filters.setPage}
        entityLabelPlural={copy.entityLabelPlural}
        emptyState={{
          icon: <Users className="h-8 w-8 text-muted-foreground" />,
          title:
            resolvedAttention === "all" && !filters.search.trim()
              ? copy.emptyAllTitle
              : copy.emptyTitle,
          description:
            resolvedAttention === "all" && !filters.search.trim()
              ? copy.emptyAllDescription
              : copy.emptyDescription,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <OperatorPaymentsAttentionChips
              value={resolvedAttention}
              onChange={handleAttentionChange}
              counts={chipCounts}
            />
          ),
          onRefresh: handleRefresh,
          isRefreshing: listQuery.isFetching,
        }}
        renderTable={() =>
          showLoadError ? null : (
            <div
              className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"
              data-testid="operators-work-grid"
            >
              <OperatorPaymentsTable
                operators={filteredOperators}
                isLoading={listQuery.isLoading || isBootstrapping}
                selectedEmployeeId={selectedId}
                onSelect={(row) => setSelectedId(row.employeeId)}
              />
              <OperatorPaymentReadinessPanel
                operator={selectedOperator}
                canAssign={canAssign}
                onAssignTariff={(employeeId) => openBatchAssign([employeeId])}
              />
            </div>
          )
        }
      />

      {canAssign ? (
        <>
          <OperatorAssignTariffPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onPick={handlePickTemplate}
          />
          {batchTemplateId ? (
            <TemplateAssignmentBatchSheet
              open
              onOpenChange={(open) => {
                if (!open) {
                  setBatchTemplateId(null);
                  setBatchEmployeeIds([]);
                }
              }}
              templateId={batchTemplateId}
              initialEmployeeIds={batchEmployeeIds}
              onAssignmentsCreated={handleBatchSuccess}
              onSuccess={handleBatchSuccess}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
