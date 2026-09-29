/**
 * DriversListPage — padrón de conductores (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; licencias por vencer = toggle del riel;
 * estado / sucursal en «Filtros (n)»; default = todos los estados (incluye Baja).
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import { cn } from "@shared/lib/utils/cn";
import { useListingFilters, useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
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
import { ROLES } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
import { BranchStatus, useBranches } from "@features/branches";
import { MasterImportWizard } from "@features/imports";
import { Plus, Search, AlertTriangle, FileUp, Loader2 } from "lucide-react";

import { useDrivers, useDeleteDriver } from "../../application";
import {
  type DriverListItem,
  type DriverStatusType,
  getDriverPrimaryLicenseNumber,
} from "../../domain";
import {
  DriverTable,
  DriverCard,
  DriverCardSkeleton,
  DriverListFilters,
} from "../components";
import { driversCopy } from "../copy/driversCopy";
import { DRIVER_STATUS_CONFIG } from "../index";
import { countDriverPanelFilters } from "../utils/driverListFilters";

const copy = driversCopy.list;

export function DriversListPage() {
  const navigate = useNavigate();
  const fromState = useListQueueFromState();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isManager = role === ROLES.MANAGER;

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
        copy.chip.status(
          DRIVER_STATUS_CONFIG[value as DriverStatusType]?.label || value,
        ),
      licenseExpiring: () => copy.chip.licenseExpiring,
      branchId: (value) =>
        copy.filters.chipBranch(
          branchLabelById.get(value) ?? value.slice(0, 8),
        ),
    },
  });
  const statusFilter = filters.filters.status as DriverStatusType | "";
  const licenseExpiring = filters.filters.licenseExpiring === "true";
  const branchIdFilter = filters.filters.branchId || "";
  const activePanelFilterCount = countDriverPanelFilters({
    status: statusFilter,
    branchId: branchIdFilter,
  });
  const hasPanelFilters = activePanelFilterCount > 0;

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
  const canImport =
    hasPermission("imports", "execute") && hasPermission("drivers", "create");
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const handleView = useCallback(
    (id: string) => navigate(`/drivers/${id}`, { state: fromState }),
    [fromState, navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/drivers/${id}/edit`, { state: fromState }),
    [fromState, navigate],
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
    toast({ title: copy.page.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

  return (
    <>
      <ListPageShell
        title={copy.page.title}
        description={
          isManager && canCreate
            ? copy.page.descriptionManager
            : copy.page.description
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
            <>
              <Button
                type="button"
                variant={licenseExpiring ? "secondary" : "outline"}
                size="sm"
                onClick={handleLicenseExpiringToggle}
                aria-pressed={licenseExpiring}
                className={cn(
                  licenseExpiring &&
                    "border-warning/30 bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80",
                )}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {copy.filter.licenseExpiring}
              </Button>
              <DriverListFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                status={statusFilter}
                branchId={branchIdFilter}
                branchOptions={branchOptions}
                activePanelFilterCount={activePanelFilterCount}
                onStatusChange={(value) => filters.setFilter("status", value)}
                onBranchChange={(value) => filters.setFilter("branchId", value)}
              />
            </>
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
          title: copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.descriptionFiltered
            : canCreate
              ? isManager
                ? copy.empty.descriptionClearManager
                : copy.empty.descriptionClear
              : copy.empty.descriptionReadonly,
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
        entityType="drivers"
        lockEntityType
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
              {driverToDelete &&
              getDriverPrimaryLicenseNumber(driverToDelete)
                ? ` (licencia ${getDriverPrimaryLicenseNumber(driverToDelete!)})`
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
