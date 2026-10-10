import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, ListFilter, Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useEmployee } from "@features/employees";
import { BranchStatus, useBranches } from "@features/branches";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useMediaQuery, useToast } from "@shared/hooks";
import { formatDate } from "@shared/utils/dateUtils";
import {
  useCompensationTemplate,
  useCompensationTemplates,
  useCorridorBranchNameMap,
} from "../../application/hooks";
import {
  compensationTemplateBuildPath,
  parseAssignEmployeeIds,
  TEMPLATE_OPERATORS_PARAMS,
  withBatchCompleted,
  withBlockingAssignmentFocus,
  withFocusDismissed,
  withOperatorsClosed,
  withReturnToBatch,
  withSameTemplateFocus,
} from "../../application/compensationRoutes";
import { compensationCopy } from "../copy/compensationCopy";
import {
  CompensationTemplatesTable,
  TemplateOperatorsSheet,
} from "../components";
import type { BatchAssignmentFormSnapshot } from "../components/TemplateAssignmentBatchSheet";
import type { BatchConflictLink } from "../utils/resolveBatchConflictView";
import { findTemplateFocusTarget } from "../utils/templateListRow";
import {
  parseTemplateListStatusFilter,
  TEMPLATE_LIST_STATUS_OPTIONS,
  templateListStatusFilterLabel,
  templateListStatusFilterToQuery,
  templateListStatusFilterToUrl,
  type TemplateListStatusFilter,
} from "../utils/templateListStatusFilter";
import { TariffPresetSelector } from "../components/TariffPresetSelector";
import { useRegisterCompensationHubCreateAction } from "../hooks/useRegisterCompensationHubCreateAction";

const copy = compensationCopy.templates;
const hubCopy = compensationCopy.hub;

const LIST_PAGE_SIZE = 20;

const NO_EXPANDED_FAMILIES: ReadonlySet<string> = new Set();

interface FamilyExpansion {
  /** Búsqueda + filtro + página: al cambiar, las familias desplegadas se cierran. */
  contextKey: string;
  familyIds: ReadonlySet<string>;
}

export function CompensationTemplateListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pendingEmployeeId = searchParams.get("employeeId")?.trim() ?? "";
  const operatorsTemplateId = searchParams.get("operators")?.trim() || null;
  const assignRaw = searchParams.get(TEMPLATE_OPERATORS_PARAMS.assign) ?? "";
  const assignFrom =
    searchParams.get(TEMPLATE_OPERATORS_PARAMS.assignFrom)?.trim() || undefined;
  const paymentPeriodStart = searchParams.get("periodStart")?.trim() || undefined;
  const paymentPeriodEnd = searchParams.get("periodEnd")?.trim() || undefined;
  const focusAssignmentId =
    searchParams.get(TEMPLATE_OPERATORS_PARAMS.focus)?.trim() || undefined;
  const returnTemplateId =
    searchParams.get(TEMPLATE_OPERATORS_PARAMS.returnTo)?.trim() || undefined;
  const returnEffectiveFrom =
    searchParams.get(TEMPLATE_OPERATORS_PARAMS.returnFrom)?.trim() || undefined;
  const isDesktop = !useMediaQuery("(max-width: 1023px)");

  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "update");
  const canUpdate = canCreate;

  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: employeeData } = useEmployee(
    pendingEmployeeId,
    Boolean(pendingEmployeeId),
  );
  const employeeName = employeeData?.data?.fullName;

  const filters = useListingFilters<"status">({
    filters: { status: {} },
    chipLabels: {
      status: (value) =>
        copy.filters.chipLabel(
          templateListStatusFilterLabel(parseTemplateListStatusFilter(value)),
        ),
    },
  });

  const statusFilter = parseTemplateListStatusFilter(filters.filters.status);
  const searchTerm = filters.search.trim();

  /** `useListingFilters` borra `all` de la URL; aquí `?status=all` sí es un valor. */
  const setStatusFilter = useCallback(
    (value: TemplateListStatusFilter) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const urlValue = templateListStatusFilterToUrl(value);
        if (urlValue) next.set("status", urlValue);
        else next.delete("status");
        next.set("page", "1");
        return next;
      });
    },
    [setSearchParams],
  );

  /** Un valor de `?status=` desconocido equivale a «Vigentes»: sin chip. */
  const activeFilterChips = useMemo(
    () =>
      statusFilter === "current"
        ? filters.activeChips.filter((chip) => chip.id !== "status")
        : filters.activeChips,
    [filters.activeChips, statusFilter],
  );
  const hasFilters = Boolean(searchTerm) || statusFilter !== "current";

  const { data, isLoading, isFetching, refetch } = useCompensationTemplates({
    search: searchTerm || undefined,
    ...templateListStatusFilterToQuery(statusFilter),
    page: filters.page,
    pageSize: LIST_PAGE_SIZE,
  });

  const templates = useMemo(() => data?.data ?? [], [data?.data]);

  /** PRD D23: «Vigentes» vacío, pero el tenant sí tiene tarifas (desactivadas o reemplazadas). */
  const isCurrentEmpty =
    statusFilter === "current" && !searchTerm && data !== undefined && templates.length === 0;
  const { data: anyTemplatesData, isLoading: isAnyTemplatesLoading } = useCompensationTemplates(
    { groupBy: "family", page: 1, pageSize: 1 },
    { enabled: isCurrentEmpty },
  );
  const showCurrentEmpty = isCurrentEmpty && (anyTemplatesData?.pagination.total ?? 0) > 0;

  const expansionContextKey = `${searchTerm}|${statusFilter}|${filters.page}`;
  const [expansion, setExpansion] = useState<FamilyExpansion>(() => ({
    contextKey: expansionContextKey,
    familyIds: NO_EXPANDED_FAMILIES,
  }));
  const expandedFamilyIds =
    expansion.contextKey === expansionContextKey ? expansion.familyIds : NO_EXPANDED_FAMILIES;

  const setFamilyExpanded = useCallback(
    (familyId: string, expanded: boolean) => {
      setExpansion((current) => {
        const next = new Set(
          current.contextKey === expansionContextKey ? current.familyIds : NO_EXPANDED_FAMILIES,
        );
        if (expanded) next.add(familyId);
        else next.delete(familyId);
        return { contextKey: expansionContextKey, familyIds: next };
      });
    },
    [expansionContextKey],
  );

  const { data: branchesData } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
  });
  const pageCorridors = useMemo(
    () => templates.flatMap((template) => template.corridors ?? []),
    [templates],
  );
  const branchNameMap = useCorridorBranchNameMap(pageCorridors, branchesData?.data ?? []);

  const listOperatorsTemplate = useMemo(
    () =>
      templates.find((template) => template.id === operatorsTemplateId) ?? null,
    [templates, operatorsTemplateId],
  );

  const { data: fetchedOperatorsTemplate } = useCompensationTemplate(
    operatorsTemplateId && !listOperatorsTemplate
      ? operatorsTemplateId
      : undefined,
  );

  const operatorsTemplate =
    listOperatorsTemplate ?? fetchedOperatorsTemplate ?? null;

  /**
   * PRD D21: `?operators=` de una versión que no es fila despliega su familia si está en la
   * página (se empata por `familyId`); una sola vez por versión abierta.
   */
  const [autoExpandedFor, setAutoExpandedFor] = useState<string | null>(null);
  if (
    operatorsTemplateId &&
    operatorsTemplateId !== autoExpandedFor &&
    !listOperatorsTemplate &&
    data !== undefined &&
    fetchedOperatorsTemplate?.id === operatorsTemplateId
  ) {
    setAutoExpandedFor(operatorsTemplateId);
    const familyId = fetchedOperatorsTemplate.familyId;
    if (
      templates.some((template) => template.familyId === familyId) &&
      !expandedFamilyIds.has(familyId)
    ) {
      setExpansion({
        contextKey: expansionContextKey,
        familyIds: new Set([...expandedFamilyIds, familyId]),
      });
    }
  } else if (!operatorsTemplateId && autoExpandedFor) {
    setAutoExpandedFor(null);
  }

  const clearPendingEmployee = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("employeeId");
        next.delete("periodStart");
        next.delete("periodEnd");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const openOperators = useCallback(
    (templateId: string, assignId?: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("operators", templateId);
          if (assignId) {
            next.set("assign", assignId);
          } else {
            next.delete("assign");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const closeOperators = useCallback(() => {
    setSearchParams(withOperatorsClosed, { replace: true });
  }, [setSearchParams]);

  /** Versión abierta por `focus`: tras «Listo» sigue sin abrir el lote del banner (D23). */
  const [focusedTemplateId, setFocusedTemplateId] = useState<string | null>(null);
  if (focusAssignmentId && operatorsTemplateId !== focusedTemplateId) {
    setFocusedTemplateId(operatorsTemplateId);
  } else if (!focusAssignmentId && focusedTemplateId && operatorsTemplateId !== focusedTemplateId) {
    setFocusedTemplateId(null);
  }
  const suppressPendingBatch =
    Boolean(focusAssignmentId) || (focusedTemplateId !== null && operatorsTemplateId === focusedTemplateId);

  /** Por texto de la URL: un arreglo nuevo en cada render reabriría o reiniciaría el lote. */
  const batchInitialEmployeeIds = useMemo(() => {
    const assignIds = parseAssignEmployeeIds(assignRaw);
    if (assignIds.length > 0) return assignIds;
    if (suppressPendingBatch) return undefined;
    return pendingEmployeeId && operatorsTemplateId ? [pendingEmployeeId] : undefined;
  }, [assignRaw, suppressPendingBatch, pendingEmployeeId, operatorsTemplateId]);

  const openBlockingAssignment = useCallback(
    (link: BatchConflictLink, form: BatchAssignmentFormSnapshot) => {
      setSearchParams(
        (prev) => {
          if (link.type === "same-template") {
            return withSameTemplateFocus(prev, link.assignmentId);
          }
          const originTemplateId = prev.get(TEMPLATE_OPERATORS_PARAMS.operators)?.trim();
          if (!originTemplateId) return prev;
          return withBlockingAssignmentFocus(prev, {
            targetTemplateId: link.templateId,
            assignmentId: link.assignmentId,
            returnTemplateId: originTemplateId,
            returnEmployeeIds: form.employeeIds,
            returnEffectiveFrom: form.effectiveFrom,
          });
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const returnToBatch = useCallback(() => {
    setSearchParams(withReturnToBatch, { replace: true });
  }, [setSearchParams]);

  const dismissFocus = useCallback(() => {
    setSearchParams(withFocusDismissed, { replace: true });
  }, [setSearchParams]);

  const handleOperatorsOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeOperators();
    },
    [closeOperators],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: compensationCopy.toasts.dataRefreshed, variant: "success" });
  }, [refetch, toast]);

  const openCreate = useCallback(() => setDialogOpen(true), []);

  const hubCreateAction = useMemo(
    () =>
      canCreate ? { label: copy.create, onClick: openCreate } : null,
    [canCreate, openCreate],
  );
  useRegisterCompensationHubCreateAction(hubCreateAction);

  const handleTemplateCreated = useCallback(
    (template: { id: string }) => {
      navigate(compensationTemplateBuildPath(template.id));
    },
    [navigate],
  );

  const handleDeleted = useCallback(() => {
    if (operatorsTemplateId) closeOperators();
    void refetch();
  }, [closeOperators, operatorsTemplateId, refetch]);

  /** Lote con todos asignados: cierra ambos sheets y limpia banner employeeId + período. */
  const handleBatchSuccess = useCallback(() => {
    void refetch();
    setSearchParams(withBatchCompleted, { replace: true });
  }, [refetch, setSearchParams]);

  const assignBannerDescription = employeeName
    ? hubCopy.employeeAssignBanner.descriptionNamed.replace(
        "{{name}}",
        employeeName,
      )
    : hubCopy.employeeAssignBanner.description;

  return (
    <>
      {pendingEmployeeId ? (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{hubCopy.employeeAssignBanner.title}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{assignBannerDescription}</p>
            {paymentPeriodStart && paymentPeriodEnd ? (
              <p className="text-xs opacity-90">
                {hubCopy.employeeAssignBanner.periodContextHint(
                  formatDate(paymentPeriodStart),
                  formatDate(paymentPeriodEnd),
                )}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {templates.length === 0 && canCreate ? (
                <Button type="button" size="sm" onClick={openCreate}>
                  {hubCopy.employeeAssignBanner.createAction}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={clearPendingEmployee}
              >
                Cerrar aviso
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <ListPageShell
        showHeader={false}
        title={copy.title}
        description={copy.description}
        items={templates}
        isLoading={isLoading || (isCurrentEmpty && isAnyTemplatesLoading)}
        entityLabelPlural="tarifas"
        pagination={
          data?.pagination
            ? {
                page: data.pagination.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        emptyState={
          showCurrentEmpty
            ? {
                icon: <ListFilter className="h-8 w-8 text-muted-foreground" />,
                title: copy.currentEmpty.title,
                description: copy.currentEmpty.description,
                cta: {
                  label: copy.currentEmpty.viewAll,
                  onClick: () => setStatusFilter("all"),
                },
                secondaryCta: canCreate
                  ? { label: copy.create, onClick: openCreate }
                  : undefined,
              }
            : {
                icon: <Plus className="h-8 w-8 text-muted-foreground" />,
                title: copy.emptyTitle,
                description: copy.emptyDescription,
                cta: canCreate
                  ? { label: copy.create, onClick: openCreate }
                  : undefined,
              }
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(parseTemplateListStatusFilter(value))
              }
            >
              <SelectTrigger
                className="w-56"
                aria-label={copy.filters.statusPlaceholder}
              >
                <SelectValue placeholder={copy.filters.statusPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_LIST_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {templateListStatusFilterLabel(option)}
                  </SelectItem>
                ))}
                {statusFilter === "inactive" ? (
                  <SelectItem value="inactive">
                    {templateListStatusFilterLabel("inactive")}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: filters.clearAll,
          hasFilters,
        }}
        renderTable={() => (
          <CompensationTemplatesTable
            templates={templates}
            isLoading={isLoading}
            pendingEmployeeId={pendingEmployeeId || undefined}
            branchNameMap={branchNameMap}
            layout={isDesktop ? "table" : "cards"}
            expandedFamilyIds={expandedFamilyIds}
            onFamilyExpandedChange={setFamilyExpanded}
            onOpenOperators={openOperators}
            onDeleted={handleDeleted}
          />
        )}
      />

      <TemplateOperatorsSheet
        open={Boolean(operatorsTemplateId)}
        onOpenChange={handleOperatorsOpenChange}
        template={operatorsTemplate}
        canUpdate={canUpdate}
        batchInitialEmployeeIds={batchInitialEmployeeIds}
        batchInitialEffectiveFrom={assignFrom}
        paymentPeriodStart={paymentPeriodStart}
        paymentPeriodEnd={paymentPeriodEnd}
        onAssignmentsChange={() => void refetch()}
        onBatchSuccess={handleBatchSuccess}
        focusAssignmentId={focusAssignmentId}
        returnTemplateId={returnTemplateId}
        returnEffectiveFrom={returnEffectiveFrom}
        onReturnToBatch={returnToBatch}
        onDismissFocus={dismissFocus}
        onOpenBlockingAssignment={openBlockingAssignment}
        getCloseFocusTarget={findTemplateFocusTarget}
      />

      <TariffPresetSelector
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}
