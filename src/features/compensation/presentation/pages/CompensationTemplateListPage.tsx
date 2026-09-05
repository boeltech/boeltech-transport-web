import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Plus } from "lucide-react";
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
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useMediaQuery, useToast } from "@shared/hooks";
import {
  useCompensationTemplate,
  useCompensationTemplates,
} from "../../application/hooks";
import { compensationTemplateBuildPath } from "../../application/compensationRoutes";
import { compensationCopy } from "../copy/compensationCopy";
import {
  CompensationTemplateCreateDialog,
  CompensationTemplatesTable,
  TemplateOperatorsSheet,
} from "../components";
import { useRegisterCompensationHubCreateAction } from "../hooks/useRegisterCompensationHubCreateAction";

const copy = compensationCopy.templates;
const hubCopy = compensationCopy.hub;

const LIST_PAGE_SIZE = 20;

function parseActiveFilter(raw: string): boolean | undefined {
  if (raw === "active") return true;
  if (raw === "inactive") return false;
  return undefined;
}

export function CompensationTemplateListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pendingEmployeeId = searchParams.get("employeeId")?.trim() ?? "";
  const operatorsTemplateId = searchParams.get("operators")?.trim() || null;
  const assignEmployeeId = searchParams.get("assign")?.trim() || null;
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
          value === "active"
            ? copy.filters.active
            : value === "inactive"
              ? copy.filters.inactive
              : value,
        ),
    },
  });

  const statusFilter = filters.filters.status;
  const isActive = parseActiveFilter(statusFilter);

  const { data, isLoading, isFetching, refetch } = useCompensationTemplates({
    search: filters.search.trim() || undefined,
    isActive,
    page: filters.page,
    pageSize: LIST_PAGE_SIZE,
  });

  const templates = useMemo(() => data?.data ?? [], [data?.data]);

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

  const clearPendingEmployee = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("employeeId");
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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("operators");
        next.delete("assign");
        return next;
      },
      { replace: true },
    );
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
        isLoading={isLoading}
        entityLabelPlural="esquemas de compensación"
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
        emptyState={{
          icon: <Plus className="h-8 w-8 text-muted-foreground" />,
          title: copy.emptyTitle,
          description: copy.emptyDescription,
          cta: canCreate
            ? { label: copy.create, onClick: openCreate }
            : undefined,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <Select
              value={statusFilter || "all"}
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
                <SelectItem value="active">{copy.filters.active}</SelectItem>
                <SelectItem value="inactive">{copy.filters.inactive}</SelectItem>
              </SelectContent>
            </Select>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
        }}
        renderTable={() => (
          <CompensationTemplatesTable
            templates={templates}
            isLoading={isLoading}
            canUpdate={canUpdate}
            pendingEmployeeId={pendingEmployeeId || undefined}
            layout={isDesktop ? "table" : "cards"}
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
        batchInitialEmployeeIds={
          assignEmployeeId
            ? [assignEmployeeId]
            : pendingEmployeeId && operatorsTemplateId
              ? [pendingEmployeeId]
              : undefined
        }
        onAssignmentsChange={() => void refetch()}
      />

      <CompensationTemplateCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}
