/**
 * ClientsListPage
 * Clean Architecture - Presentation Layer
 *
 * Página principal del módulo de clientes.
 * Muestra la lista de clientes con filtros y paginación.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientsListPage.tsx
 */

import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Plus,
  Users,
  Building2,
  User,
} from "lucide-react";

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
// COMPONENT
// ============================================================================

export function ClientsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const listing = useListingFilters<"type" | "paymentTerms" | "status">({
    filters: {
      type: {},
      paymentTerms: {},
      status: {},
    },
    chipLabels: {
      type: (value) =>
        `Tipo: ${CLIENT_TYPE_CONFIG[value as ClientType]?.label || value}`,
      paymentTerms: (value) =>
        `Pago: ${PAYMENT_TERMS_CONFIG[value as PaymentTerms]?.label || value}`,
      status: (value) =>
        `Estado: ${CLIENT_STATUS_CONFIG[value === "true" ? "active" : "inactive"]?.label}`,
    },
  });
  const typeFilter = listing.filters.type as ClientType | "";
  const paymentTermsFilter = listing.filters.paymentTerms as PaymentTerms | "";
  const statusFilter = listing.filters.status;
  const sortBy = searchParams.get("sortBy") || "legal_name";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

  // Build filters
  const clientFilters: ClientFilters = {
    search: listing.search || undefined,
    type: typeFilter || undefined,
    paymentTerms: paymentTermsFilter || undefined,
    isActive: statusFilter ? statusFilter === "true" : undefined,
  };

  // Query
  const { data, isLoading, isFetching, refetch } = useClients(clientFilters, {
    page: listing.page,
    limit: DEFAULT_PAGE_SIZE,
    sortBy,
    sortOrder,
  });

  const clients = data?.data ?? [];

  // Permisos
  const canCreate = hasPermission("clients", "create");

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
  const handleCreate = useCallback(() => {
    navigate("/clients/new");
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  return (
    <ListPageShell
      title="Clientes"
      description="Gestiona tus clientes y sus direcciones"
      primaryAction={{
        label: "Nuevo Cliente",
        icon: <Plus className="h-4 w-4" />,
        onClick: handleCreate,
        visible: canCreate,
      }}
      toolbar={{
        search: {
          ...listing.searchProps,
          placeholder: "Buscar por nombre, RFC...",
        },
        filters: (
          <>
            <Select
              value={typeFilter || "all"}
              onValueChange={(value) => listing.setFilter("type", value)}
            >
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

            <Select
              value={paymentTermsFilter || "all"}
              onValueChange={(value) => listing.setFilter("paymentTerms", value)}
            >
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

            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => listing.setFilter("status", value)}
            >
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
          </>
        ),
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: listing.activeChips,
        onClearFilters: listing.clearAll,
        hasFilters: listing.hasFilters,
        viewMode: listing.viewModeProps,
      }}
      isLoading={isLoading}
      items={clients}
      pagination={
        data?.pagination
          ? {
              page: listing.page,
              totalPages: data.pagination.totalPages,
              total: data.pagination.total,
              limit: data.pagination.limit,
            }
          : undefined
      }
      onPageChange={listing.setPage}
      entityLabelPlural="clientes"
      renderTable={() => (
        <ClientTable
          clients={clients}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSortChange}
        />
      )}
      renderCards={() => clients.map((client) => <ClientCard key={client.id} client={client} />)}
      renderCardSkeleton={() => <ClientCardSkeleton />}
      emptyState={{
        icon: <Users className="h-10 w-10 text-muted-foreground" />,
        title: "No se encontraron clientes",
        description: listing.hasFilters
          ? "Intenta ajustar los filtros de búsqueda"
          : "Comienza agregando tu primer cliente",
        cta: canCreate
          ? {
              label: "Nuevo Cliente",
              icon: <Plus className="h-4 w-4" />,
              onClick: handleCreate,
            }
          : undefined,
        secondaryCta: listing.hasFilters
          ? {
              label: "Limpiar filtros",
              onClick: listing.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}

export default ClientsListPage;
