/**
 * EmployeesListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de empleados.
 * Patrón homologado con DriversListPage.
 *
 * Ubicación: src/features/employees/presentation/pages/EmployeesListPage.tsx
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useListingFilters, useToast } from "@shared/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { usePermissions } from "@shared/permissions";
import { Plus, Search } from "lucide-react";

import { useEmployees } from "../../application/hooks/useEmployees";
import type { EmployeeStatus, EmploymentType } from "../../domain/entities";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  DEFAULT_PAGE_SIZE,
} from "../config/employeeConfig";
import { EmployeeTable, EmployeeCard, EmployeeCardSkeleton } from "../components";

export function EmployeesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const filters = useListingFilters<"status" | "type">({
    filters: {
      status: {},
      type: {},
    },
    chipLabels: {
      status: (value) =>
        `Estado: ${EMPLOYEE_STATUS_LABELS[value as EmployeeStatus] || value}`,
      type: (value) =>
        `Contrato: ${EMPLOYMENT_TYPE_LABELS[value as EmploymentType] || value}`,
    },
  });
  const statusFilter = filters.filters.status as EmployeeStatus | "";
  const typeFilter = filters.filters.type as EmploymentType | "";

  const { data, isLoading, isFetching, refetch } = useEmployees({
    page: filters.page,
    limit: DEFAULT_PAGE_SIZE,
    search: filters.search || undefined,
    status: statusFilter || undefined,
    employmentType: typeFilter || undefined,
  });

  const employees = data?.data ?? [];

  const canCreate = hasPermission("employees", "create");
  const canEdit = hasPermission("employees", "update");

  const handleView = useCallback(
    (id: string) => navigate(`/employees/${id}`),
    [navigate],
  );
  const handleEdit = useCallback(
    (id: string) => navigate(`/employees/${id}/edit`),
    [navigate],
  );
  const handleCreate = useCallback(() => {
    navigate("/employees/new");
  }, [navigate]);
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  return (
    <ListPageShell
      title="Empleados"
      description="Gestiona el personal de la empresa"
      primaryAction={{
        label: "Nuevo Empleado",
        icon: <Plus className="h-4 w-4" />,
        onClick: handleCreate,
        visible: canCreate,
      }}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: "Buscar por nombre, RFC, CURP...",
        },
        filters: (
          <>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => filters.setFilter("status", value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {(Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {EMPLOYEE_STATUS_LABELS[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select
              value={typeFilter || "all"}
              onValueChange={(value) => filters.setFilter("type", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {EMPLOYMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </>
        ),
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
        title: "No se encontraron empleados",
        description: filters.hasFilters
          ? "Intenta ajustar los filtros de búsqueda"
          : "Comienza registrando el primer empleado",
        cta: canCreate
          ? {
              label: "Nuevo Empleado",
              icon: <Plus className="h-4 w-4" />,
              onClick: handleCreate,
            }
          : undefined,
        secondaryCta: filters.hasFilters
          ? {
              label: "Limpiar filtros",
              onClick: filters.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}
