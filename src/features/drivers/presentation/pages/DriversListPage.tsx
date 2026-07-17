/**
 * DriversListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de conductores.
 * Sin selección múltiple (checkboxes).
 *
 * Ubicación: src/features/drivers/presentation/pages/DriversListPage.tsx
 */

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { useListingFilters, useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { usePermissions } from "@shared/permissions";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
import { BranchStatus, useBranches } from "@features/branches";
import { Plus, Search, AlertTriangle, Loader2 } from "lucide-react";

import { useDrivers, useDeleteDriver } from "../../application";
import {
  DriverStatus,
  type DriverListItem,
  type DriverStatusType,
  DRIVER_STATUS_LABELS,
} from "../../domain";
import { DriverTable, DriverCard, DriverCardSkeleton } from "../components";
import { driversCopy } from "../copy/driversCopy";
import { DRIVER_STATUS_CONFIG } from "../index";

const listFilterCopy = driversCopy.list.filters;

// ============================================================================
// COMPONENT
// ============================================================================

export function DriversListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const { data: branchesResult } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const branchOptions = useMemo(
    () => buildBranchSelectOptions(branchesResult?.data ?? []),
    [branchesResult?.data],
  );

  const branchLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of branchOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [branchOptions]);

  const filters = useListingFilters<"status" | "licenseExpiring" | "branchId">({
    filters: {
      status: {},
      licenseExpiring: {},
      branchId: {},
    },
    chipLabels: {
      status: (value) =>
        `Estado: ${DRIVER_STATUS_CONFIG[value as DriverStatusType]?.label || value}`,
      licenseExpiring: () => "Licencias por vencer",
      branchId: (value) =>
        listFilterCopy.chipBranch(
          branchLabelById.get(value) ?? value.slice(0, 8),
        ),
    },
  });
  const statusFilter = filters.filters.status as DriverStatusType | "";
  const licenseExpiring = filters.filters.licenseExpiring === "true";
  const branchIdFilter = filters.filters.branchId || "";

  const { data, isLoading, isFetching, refetch } = useDrivers({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
      search: filters.search || undefined,
      licenseExpiringSoon: licenseExpiring || undefined,
      branchId: branchIdFilter || undefined,
    },
    sort: { field: "employee_name", direction: "asc" },
  });

  const drivers = data?.data ?? [];

  const [driverToDelete, setDriverToDelete] = useState<DriverListItem | null>(
    null,
  );

  const deleteMutation = useDeleteDriver({
    onSuccess: () => {
      toast({ title: "Conductor eliminado", variant: "success" });
      setDriverToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canCreate = hasPermission("drivers", "create");
  const canEdit = hasPermission("drivers", "update");
  const canDelete = hasPermission("drivers", "delete");

  const handleView = useCallback(
    (id: string) => navigate(`/drivers/${id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/drivers/${id}/edit`),
    [navigate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const driver = drivers.find((d) => d.id === id);
      if (driver) setDriverToDelete(driver);
    },
    [drivers],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!driverToDelete) return;
    deleteMutation.mutate(driverToDelete.id);
  }, [deleteMutation, driverToDelete]);

  const handleLicenseExpiringToggle = useCallback(() => {
    filters.setFilter("licenseExpiring", licenseExpiring ? "" : "true");
  }, [filters, licenseExpiring]);
  const handleCreate = useCallback(() => {
    navigate("/drivers/new");
  }, [navigate]);
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  return (
    <>
      <ListPageShell
        title="Conductores"
        description="Gestiona los conductores de la flota"
        primaryAction={{
          label: "Nuevo Conductor",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: "Buscar conductor...",
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
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.values(DriverStatus).map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {DRIVER_STATUS_LABELS[statusValue]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={branchIdFilter || "all"}
                onValueChange={(value) => filters.setFilter("branchId", value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={listFilterCopy.branch} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {listFilterCopy.allBranches}
                  </SelectItem>
                  {branchOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={licenseExpiring ? "secondary" : "outline"}
                size="sm"
                onClick={handleLicenseExpiringToggle}
                className={cn(
                  licenseExpiring &&
                    "border-warning/30 bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80",
                )}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Licencias por vencer
              </Button>
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
        items={drivers}
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
        entityLabelPlural="conductores"
        renderTable={() => (
          <DriverTable
            drivers={drivers}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
        renderCards={() =>
          drivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ))
        }
        renderCardSkeleton={() => <DriverCardSkeleton />}
        emptyState={{
          icon: <Search className="h-10 w-10 text-muted-foreground" />,
          title: "No se encontraron conductores",
          description: filters.hasFilters
            ? "Intenta ajustar los filtros de búsqueda"
            : "Comienza agregando tu primer conductor",
          cta: canCreate
            ? {
                label: "Nuevo Conductor",
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

      <AlertDialog
        open={driverToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDriverToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este conductor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El conductor{" "}
              <strong>{driverToDelete?.employee.fullName}</strong>
              {driverToDelete?.licenseNumber
                ? ` (licencia ${driverToDelete.licenseNumber})`
                : ""}{" "}
              será eliminado del sistema y dejará de estar disponible para
              asignaciones a viajes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
