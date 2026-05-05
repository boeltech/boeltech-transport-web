import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  BranchStatus,
  BRANCH_STATUS_LABELS,
  type BranchStatusType,
} from "../../domain";
import { useBranches, useDeleteBranch } from "../../application";
import { BranchTable } from "../components";

export function BranchesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const filters = useListingFilters<"status" | "main">({
    filters: {
      status: {},
      main: { paramName: "isMain" },
    },
    chipLabels: {
      status: (value) =>
        `Estado: ${BRANCH_STATUS_LABELS[value as BranchStatusType] ?? value}`,
      main: (value) => `Tipo: ${value === "true" ? "Principal" : "Secundaria"}`,
    },
  });

  const statusFilter = filters.filters.status as BranchStatusType | "";
  const mainFilter = filters.filters.main;

  const { data, isLoading, isFetching, refetch } = useBranches({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
      isMain: mainFilter ? mainFilter === "true" : undefined,
      search: filters.search || undefined,
      isActive: true,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      toast({
        title: "Sucursal eliminada",
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar sucursal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const branches = data?.data ?? [];
  const canCreate = hasPermission("branches", "create");
  const canDelete = hasPermission("branches", "delete");

  const handleCreate = useCallback(() => navigate("/branches/new"), [navigate]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: "Lista actualizada",
      variant: "success",
    });
  }, [refetch, toast]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!canDelete) return;
      deleteMutation.mutate(id);
    },
    [canDelete, deleteMutation],
  );

  return (
    <ListPageShell
      title="Sucursales"
      description="Catálogo de sucursales de la empresa"
      primaryAction={{
        label: "Nueva sucursal",
        icon: <Plus className="h-4 w-4" />,
        onClick: handleCreate,
        visible: canCreate,
      }}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: "Buscar sucursal...",
        },
        filters: (
          <>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => filters.setFilter("status", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={BranchStatus.ACTIVE}>
                  {BRANCH_STATUS_LABELS[BranchStatus.ACTIVE]}
                </SelectItem>
                <SelectItem value={BranchStatus.INACTIVE}>
                  {BRANCH_STATUS_LABELS[BranchStatus.INACTIVE]}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={mainFilter || "all"}
              onValueChange={(value) => filters.setFilter("main", value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="true">Principal</SelectItem>
                <SelectItem value="false">Secundaria</SelectItem>
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
      items={branches}
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
      entityLabelPlural="sucursales"
      renderTable={() => (
        <BranchTable
          branches={branches}
          isLoading={isLoading}
          onDelete={canDelete ? handleDelete : undefined}
        />
      )}
      emptyState={{
        icon: <Search className="h-10 w-10 text-muted-foreground" />,
        title: "No se encontraron sucursales",
        description: filters.hasFilters
          ? "Intenta ajustar los filtros de búsqueda."
          : "Comienza registrando la primera sucursal.",
        cta: canCreate
          ? {
              label: "Nueva sucursal",
              icon: <Building2 className="h-4 w-4" />,
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
