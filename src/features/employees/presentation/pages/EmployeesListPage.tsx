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
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { generatePageNumbers } from "@shared/lib/utils/generatePageNumbers";
import {
  Plus,
  LayoutGrid,
  LayoutList,
  Search,
  RefreshCw,
  X,
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
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("search", value);
        else params.delete("search");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
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
            Nuevo empleado
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RFC, CURP..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

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
          <div className="flex border rounded-md ml-auto">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Vista de tabla"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("cards")}
              title="Vista de tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters summary */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtros activos:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Búsqueda: &ldquo;{search}&rdquo;
                <button
                  onClick={() => handleSearchChange("")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Estado: {EMPLOYEE_STATUS_LABELS[statusFilter]}
                <button
                  onClick={() => handleStatusChange("all")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Contrato: {EMPLOYMENT_TYPE_LABELS[typeFilter]}
                <button
                  onClick={() => handleTypeChange("all")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results summary */}
      {pagination && (
        <div className="text-sm text-muted-foreground">
          {pagination.total === 0 ? (
            "No se encontraron empleados"
          ) : (
            <>
              Mostrando{" "}
              <span className="font-medium">
                {(page - 1) * pagination.limit + 1}–
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{" "}
              de <span className="font-medium">{pagination.total}</span>{" "}
              empleados
            </>
          )}
        </div>
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
                    Nuevo empleado
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
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Página {page} de {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(1)}
            >
              Primera
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Anterior
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {generatePageNumbers(page, pagination.totalPages).map(
                (pageNum, idx) =>
                  pageNum === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => handlePageChange(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  ),
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Siguiente
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.totalPages)}
            >
              Última
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
