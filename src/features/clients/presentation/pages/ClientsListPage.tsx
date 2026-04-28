/**
 * ClientsListPage
 * Clean Architecture - Presentation Layer
 *
 * Página principal del módulo de clientes.
 * Muestra la lista de clientes con filtros y paginación.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientsListPage.tsx
 */

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDebouncedSearchParam } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  ActiveFilterChips,
  ListingPagination,
  ListingResultsSummary,
  ListingSearchInput,
  ViewModeToggle,
} from "@shared/ui/listing";
import {
  Plus,
  Users,
  Building2,
  User,
  RefreshCw,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { useClients } from "../../application";
import type { ClientFilters, ClientType, PaymentTerms } from "../../domain";
import { ClientTable, ClientCard, ClientCardSkeleton } from "../components";
import {
  CLIENT_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  STATUS_OPTIONS,
  CLIENT_TYPE_CONFIG,
  CLIENT_STATUS_CONFIG,
  PAYMENT_TERMS_CONFIG,
  DEFAULT_PAGE_SIZE,
} from "../config/clientConfig";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "table" | "cards";

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const typeFilter = searchParams.get("type") || "";
  const paymentTermsFilter = searchParams.get("paymentTerms") || "";
  const statusFilter = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "legal_name";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

  const { searchInput, setSearchInput } = useDebouncedSearchParam(
    search,
    setSearchParams,
  );

  // Build filters
  const filters: ClientFilters = {
    search: search || undefined,
    type: (typeFilter as ClientType) || undefined,
    paymentTerms: (paymentTermsFilter as PaymentTerms) || undefined,
    isActive: statusFilter ? statusFilter === "true" : undefined,
  };

  // Query
  const { data, isLoading, isFetching, refetch } = useClients(filters, {
    page,
    limit: DEFAULT_PAGE_SIZE,
    sortBy,
    sortOrder,
  });

  const clients = data?.data ?? [];
  const pagination = data?.pagination;

  // Permisos
  const canCreate = hasPermission("clients", "create");

  // Filtros activos
  const hasFilters = !!(search || typeFilter || paymentTermsFilter || statusFilter);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
    },
    [setSearchInput],
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

  const handlePaymentTermsChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value && value !== "all") params.set("paymentTerms", value);
        else params.delete("paymentTerms");
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

  const handleSortChange = useCallback(
    (field: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        const currentSortBy = params.get("sortBy") || "legal_name";
        const currentOrder = params.get("sortOrder") || "asc";
        if (currentSortBy === field) {
          params.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
        } else {
          params.set("sortBy", field);
          params.set("sortOrder", "asc");
        }
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
    setSearchInput("");
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("search");
      params.delete("type");
      params.delete("paymentTerms");
      params.delete("status");
      params.set("page", "1");
      return params;
    });
  }, [setSearchInput, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus clientes y sus direcciones
          </p>
        </div>

        {canCreate && (
          <Button onClick={() => navigate("/clients/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <ListingSearchInput
            placeholder="Buscar por nombre, RFC..."
            value={searchInput}
            onChange={handleSearchChange}
          />

          {/* Type filter */}
          <Select value={typeFilter || "all"} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-44">
              <div className="flex items-center gap-2">
                {typeFilter === "company" ? (
                  <Building2 className="h-4 w-4" />
                ) : typeFilter === "individual" ? (
                  <User className="h-4 w-4" />
                ) : null}
                <SelectValue placeholder="Tipo de cliente" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {CLIENT_TYPE_OPTIONS.filter((o) => o.value !== "all").map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment terms filter */}
          <Select value={paymentTermsFilter || "all"} onValueChange={handlePaymentTermsChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Términos de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PAYMENT_TERMS_OPTIONS.filter((o) => o.value !== "all").map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {STATUS_OPTIONS.filter((o) => o.value !== "all").map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>

          {/* View mode toggle */}
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
            ...(typeFilter
              ? [
                  {
                    id: "type",
                    label: `Tipo: ${CLIENT_TYPE_CONFIG[typeFilter as ClientType]?.label || typeFilter}`,
                    onRemove: () => handleTypeChange("all"),
                  },
                ]
              : []),
            ...(paymentTermsFilter
              ? [
                  {
                    id: "payment",
                    label: `Pago: ${PAYMENT_TERMS_CONFIG[paymentTermsFilter as PaymentTerms]?.label || paymentTermsFilter}`,
                    onRemove: () => handlePaymentTermsChange("all"),
                  },
                ]
              : []),
            ...(statusFilter
              ? [
                  {
                    id: "status",
                    label: `Estado: ${CLIENT_STATUS_CONFIG[statusFilter === "true" ? "active" : "inactive"]?.label}`,
                    onRemove: () => handleStatusChange("all"),
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Results Summary */}
      {pagination && (
        <ListingResultsSummary
          entityLabelPlural="clientes"
          total={pagination.total}
          page={page}
          limit={pagination.limit}
        />
      )}

      {/* Content */}
      {viewMode === "table" ? (
        <ClientTable
          clients={clients}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSortChange}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ClientCardSkeleton key={i} />
            ))
          ) : clients.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                No se encontraron clientes
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza agregando tu primer cliente"}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                canCreate && (
                  <Button onClick={() => navigate("/clients/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                )
              )}
            </div>
          ) : (
            clients.map((client) => <ClientCard key={client.id} client={client} />)
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

export default ClientsListPage;
