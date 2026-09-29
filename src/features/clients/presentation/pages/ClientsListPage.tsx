/**
 * ClientsListPage — catálogo de clientes (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; tipo / pago / estado en «Filtros (n)»;
 * default = todos (activos e inactivos); importar no es recorte.
 */
import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useListingFilters, useToast } from "@shared/hooks";
import { ROLES } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
import { Plus, Users, FileUp } from "lucide-react";

import { MasterImportWizard } from "@features/imports";
import { useClients } from "../../application";
import type { ClientFilters, ClientType, PaymentTerms } from "../../domain";
import {
  ClientTable,
  ClientCard,
  ClientCardSkeleton,
  ClientListFilters,
} from "../components";
import { clientsCopy } from "../copy/clientsCopy";
import { DEFAULT_PAGE_SIZE } from "../config/clientConfig";
import {
  countClientPanelFilters,
  resolveClientListIsActive,
} from "../utils/clientListFilters";

const copy = clientsCopy;

export function ClientsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isManager = role === ROLES.MANAGER;
  const [searchParams, setSearchParams] = useSearchParams();
  const listing = useListingFilters<"type" | "paymentTerms" | "status">({
    filters: {
      type: {},
      paymentTerms: {},
      status: {},
    },
    chipLabels: {
      type: (value) =>
        value === "individual" ? copy.chip.typeIndividual : copy.chip.typeMoral,
      paymentTerms: (value) =>
        value === "cash" ? copy.chip.paymentCash : copy.chip.paymentCredit,
      status: (value) =>
        value === "inactive" ? copy.chip.statusInactive : copy.chip.statusActive,
    },
  });
  const typeFilter = listing.filters.type as ClientType | "";
  const paymentTermsFilter = listing.filters.paymentTerms as PaymentTerms | "";
  const statusFilter = listing.filters.status;
  const sortBy = searchParams.get("sortBy") || "legal_name";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
  const activePanelFilterCount = countClientPanelFilters({
    type: typeFilter,
    paymentTerms: paymentTermsFilter,
    status: statusFilter,
  });
  const hasPanelFilters = activePanelFilterCount > 0;

  const clientFilters: ClientFilters = {
    search: listing.search || undefined,
    type: typeFilter || undefined,
    paymentTerms: paymentTermsFilter || undefined,
    isActive: resolveClientListIsActive(statusFilter),
  };

  const { data, isLoading, isFetching, refetch } = useClients(clientFilters, {
    page: listing.page,
    limit: DEFAULT_PAGE_SIZE,
    sortBy,
    sortOrder,
  });

  const clients = data?.data ?? [];

  const canCreate = hasPermission("clients", "create");
  const canImport =
    hasPermission("imports", "execute") && hasPermission("clients", "create");
  const [importWizardOpen, setImportWizardOpen] = useState(false);

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
            ...listing.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <ClientListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              type={typeFilter}
              paymentTerms={paymentTermsFilter}
              status={statusFilter}
              activePanelFilterCount={activePanelFilterCount}
              onTypeChange={(value) => listing.setFilter("type", value)}
              onPaymentTermsChange={(value) =>
                listing.setFilter("paymentTerms", value)
              }
              onStatusChange={(value) => listing.setFilter("status", value)}
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
        renderCards={() =>
          clients.map((client) => <ClientCard key={client.id} client={client} />)
        }
        renderCardSkeleton={() => <ClientCardSkeleton />}
        emptyState={{
          icon: <Users className="h-10 w-10 text-muted-foreground" />,
          title: copy.empty.title,
          description: listing.hasFilters
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
          secondaryCta: listing.hasFilters
            ? {
                label: copy.actions.clearFilters,
                onClick: listing.clearAll,
                variant: "outline",
              }
            : undefined,
        }}
      />
      <MasterImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        entityType="clients"
        lockEntityType
      />
    </>
  );
}

export default ClientsListPage;
