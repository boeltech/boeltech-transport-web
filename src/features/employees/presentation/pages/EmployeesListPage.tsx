/**
 * EmployeesListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de empleados.
 * Patrón homologado con DriversListPage.
 *
 * Ubicación: src/features/employees/presentation/pages/EmployeesListPage.tsx
 */

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { useDebouncedSearchParam } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import {
  ActiveFilterChips,
  ListingPagination,
  ListingResultsSummary,
  ListingSearchInput,
  ViewModeToggle,
} from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";

import { useEmployees } from "../../application/hooks/useEmployees";
import type { EmployeeStatus, EmploymentType } from "../../domain/entities";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  DEFAULT_PAGE_SIZE,
} from "../config/employeeConfig";
import {
  EmployeeTable,
  EmployeeCard,
  EmployeeCardSkeleton,
} from "../components";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "table" | "cards";

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const statusFilter = (searchParams.get("status") || "") as EmployeeStatus | "";
  const typeFilter = (searchParams.get("type") || "") as EmploymentType | "";
  const { searchInput, setSearchInput } = useDebouncedSearchParam(
    search,
    setSearchParams,
  );

  const { data, isLoading, isFetching, refetch } = useEmployees({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: search || undefined,
    status: statusFilter || undefined,
    employmentType: typeFilter || undefined,
  });

  const employees = data?.data ?? [];
  const pagination = data?.pagination;

  // Permissions
  const canCreate = hasPermission("employees", "create");
  const canEdit = hasPermission("employees", "update");

  // Active filters
  const hasFilters = !!(search || statusFilter || typeFilter);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleView = useCallback(
    (id: string) => navigate(`/employees/${id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/employees/${id}/edit`),
    [navigate],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
    },
    [setSearchInput],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value && value !== "all") params.set("status", value);
        else params.delete("status");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value && value !== "all") params.set("type", value);
        else params.delete("type");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", newPage.toString());
        return params;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground">
            Gestiona el personal de la empresa
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/employees/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Empleado
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <ListingSearchInput
            placeholder="Buscar por nombre, RFC, CURP..."
            value={searchInput}
            onChange={handleSearchChange}
          />

          {/* Status Filter */}
          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusChange}
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

          {/* Employment Type Filter */}
          <Select
            value={typeFilter || "all"}
            onValueChange={handleTypeChange}
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

          {/* Clear Filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              await refetch();
              toast({ title: "Lista actualizada", variant: "success" });
            }}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>

          {/* View Toggle */}
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Active filters summary */}
        <ActiveFilterChips
          chips={[
            ...(search
              ? [
                  {
                    id: "search",
                    label: `Búsqueda: "${search}"`,
                    onRemove: () => handleSearchChange(""),
                  },
                ]
              : []),
            ...(statusFilter
              ? [
                  {
                    id: "status",
                    label: `Estado: ${EMPLOYEE_STATUS_LABELS[statusFilter]}`,
                    onRemove: () => handleStatusChange("all"),
                  },
                ]
              : []),
            ...(typeFilter
              ? [
                  {
                    id: "type",
                    label: `Contrato: ${EMPLOYMENT_TYPE_LABELS[typeFilter]}`,
                    onRemove: () => handleTypeChange("all"),
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Results summary */}
      {pagination && (
        <ListingResultsSummary
          entityLabelPlural="empleados"
          total={pagination.total}
          page={page}
          limit={pagination.limit}
        />
      )}

      {/* Content */}
      {viewMode === "table" ? (
        <EmployeeTable
          employees={employees}
          isLoading={isLoading}
          onView={handleView}
          onEdit={canEdit ? handleEdit : undefined}
          onTerminate={undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EmployeeCardSkeleton key={i} />
            ))
          ) : employees.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                No se encontraron empleados
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza registrando el primer empleado"}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                canCreate && (
                  <Button onClick={() => navigate("/employees/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Empleado
                  </Button>
                )
              )}
            </div>
          ) : (
            employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onView={handleView}
                onEdit={canEdit ? handleEdit : undefined}
                onTerminate={undefined}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <ListingPagination
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
