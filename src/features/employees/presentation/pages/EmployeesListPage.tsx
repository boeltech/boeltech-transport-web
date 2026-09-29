/**
 * EmployeesListPage — catálogo de personal (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; estado / contrato / puesto en «Filtros (n)»;
 * default = todos los estados (incluye Baja); importar no es recorte.
 */
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import { useListingFilters, useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { ROLES } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { FileUp, Plus, Search } from "lucide-react";

import { MasterImportWizard } from "@features/imports";
import { useEmployees } from "../../application/hooks/useEmployees";
import type {
  EmployeeSortOptions,
  EmployeeStatus,
  EmploymentType,
} from "../../domain/entities";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  DEFAULT_PAGE_SIZE,
} from "../config/employeeConfig";
import { POSITION_OPTIONS } from "../config/employeeCatalogs";
import {
  EmployeeTable,
  EmployeeCard,
  EmployeeCardSkeleton,
  EmployeeListFilters,
  type EmployeeSortableColumn,
} from "../components";
import { employeesCopy } from "../copy/employeesCopy";
import { countEmployeePanelFilters } from "../utils/employeeListFilters";

const copy = employeesCopy.list;

export function EmployeesListPage() {
  const navigate = useNavigate();
  const fromState = useListQueueFromState();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isManager = role === ROLES.MANAGER;
  const filters = useListingFilters<"status" | "type" | "position">({
    filters: {
      status: {},
      type: {},
      position: {},
    },
    chipLabels: {
      status: (value) =>
        copy.chip.status(EMPLOYEE_STATUS_LABELS[value as EmployeeStatus] || value),
      type: (value) =>
        copy.chip.type(EMPLOYMENT_TYPE_LABELS[value as EmploymentType] || value),
      position: (value) =>
        copy.chip.position(
          POSITION_OPTIONS.find((option) => option.value === value)?.label ??
            value,
        ),
    },
  });
  const statusFilter = filters.filters.status as EmployeeStatus | "";
  const typeFilter = filters.filters.type as EmploymentType | "";
  const positionFilter = filters.filters.position;
  const activePanelFilterCount = countEmployeePanelFilters({
    status: statusFilter,
    type: typeFilter,
    position: positionFilter,
  });
  const hasPanelFilters = activePanelFilterCount > 0;

  const [sort, setSort] = useState<EmployeeSortOptions>({
    field: "hire_date",
    direction: "desc",
  });

  const handleSortChange = useCallback(
    (field: EmployeeSortableColumn) => {
      setSort((prev) => {
        if (prev.field === field) {
          return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
        }
        return { field, direction: "asc" };
      });
      filters.setPage(1);
    },
    [filters],
  );

  const { data, isLoading, isFetching, refetch } = useEmployees({
    page: filters.page,
    limit: DEFAULT_PAGE_SIZE,
    search: filters.search || undefined,
    status: statusFilter || undefined,
    employmentType: typeFilter || undefined,
    position: positionFilter || undefined,
    sortBy: sort.field,
    sortOrder: sort.direction,
  });

  const employees = data?.data ?? [];

  const canCreate = hasPermission("employees", "create");
  const canEdit = hasPermission("employees", "update");
  const canImport =
    hasPermission("imports", "execute") && hasPermission("employees", "create");
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const handleView = useCallback(
    (id: string) => navigate(`/employees/${id}`, { state: fromState }),
    [fromState, navigate],
  );
  const handleEdit = useCallback(
    (id: string) => navigate(`/employees/${id}/edit`, { state: fromState }),
    [fromState, navigate],
  );
  const handleCreate = useCallback(() => {
    navigate("/employees/new");
  }, [navigate]);
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.page.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

  return (
    <>
      <ListPageShell
        title={copy.page.title}
        description={
          isManager ? copy.page.descriptionManager : copy.page.description
        }
        primaryAction={{
          label: copy.actions.create,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <EmployeeListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              status={statusFilter}
              type={typeFilter}
              position={positionFilter}
              activePanelFilterCount={activePanelFilterCount}
              onStatusChange={(value) => filters.setFilter("status", value)}
              onTypeChange={(value) => filters.setFilter("type", value)}
              onPositionChange={(value) => filters.setFilter("position", value)}
            />
          ),
          extraActions: canImport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportWizardOpen(true)}
              leftIcon={<FileUp className="h-4 w-4" />}
              aria-label={copy.actions.importAria}
            >
              {copy.actions.import}
            </Button>
          ) : null,
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
          viewMode: filters.viewModeProps,
        }}
        isLoading={isLoading}
        items={employees}
        pagination={
          data?.pagination
            ? {
                page: filters.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        entityLabelPlural="empleados"
        renderTable={() => (
          <EmployeeTable
            employees={employees}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onTerminate={undefined}
            sortField={sort.field}
            sortDirection={sort.direction}
            onSortChange={handleSortChange}
          />
        )}
        renderCards={() =>
          employees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onTerminate={undefined}
            />
          ))
        }
        renderCardSkeleton={() => <EmployeeCardSkeleton />}
        emptyState={{
          icon: <Search className="h-10 w-10 text-muted-foreground" />,
          title: copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.descriptionFiltered
            : copy.empty.descriptionClear,
          cta: canCreate
            ? {
                label: copy.actions.create,
                icon: <Plus className="h-4 w-4" />,
                onClick: handleCreate,
              }
            : undefined,
          secondaryCta: filters.hasFilters
            ? {
                label: copy.actions.clearFilters,
                onClick: filters.clearAll,
                variant: "outline",
              }
            : undefined,
        }}
      />
      <MasterImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        entityType="employees"
        lockEntityType
      />
    </>
  );
}
