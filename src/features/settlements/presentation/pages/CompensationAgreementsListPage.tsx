import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { useEmployees } from "@features/employees";
import { useCompensationAgreements } from "../../application/hooks";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  CompensationAgreementsTable,
  CompensationAgreementCard,
  CompensationAgreementCardSkeleton,
  CompensationAgreementSheet,
} from "../components";

const copy = settlementsCopy;

/**
 * @deprecated Cutover ADR-0089 (D11). Usar hub `/finance/compensation/templates`.
 * La ruta `/finance/agreements` redirige vía `AgreementsLegacyRedirect`.
 */
export function CompensationAgreementsListPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");

  const { data: employeesData } = useEmployees({ limit: 100, isActive: true });
  const employees = employeesData?.data ?? [];

  const employeeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const emp of employees) {
      map.set(emp.id, `${emp.firstName} ${emp.lastName}`);
    }
    return map;
  }, [employees]);

  const filters = useListingFilters<"employeeId">({
    filters: {
      employeeId: {},
    },
    chipLabels: {
      employeeId: (value) =>
        `Operador: ${employeeLabelById.get(value) ?? value.slice(0, 8)}`,
    },
  });

  const employeeIdFilter = filters.filters.employeeId || "";
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);

  const {
    data: agreementsData,
    isLoading: isAgreementsLoading,
    isFetching: isAgreementsFetching,
    refetch: refetchAgreements,
  } = useCompensationAgreements(employeeIdFilter || undefined);

  const agreementsList = agreementsData ?? [];

  const filteredAgreements = useMemo(() => {
    if (!filters.search.trim()) return agreementsList;
    const q = filters.search.toLowerCase();
    return agreementsList.filter(
      (ag) =>
        ag.employeeFullName && ag.employeeFullName.toLowerCase().includes(q),
    );
  }, [agreementsList, filters.search]);

  const handleRefresh = useCallback(async () => {
    await refetchAgreements();
    toast({ title: copy.toasts.dataRefreshed, variant: "success" });
  }, [refetchAgreements, toast]);

  const activeEmptyState = useMemo(() => {
    const secondaryCta = filters.hasFilters
      ? {
          label: "Limpiar filtros",
          onClick: filters.clearAll,
          variant: "outline" as const,
        }
      : undefined;

    return {
      icon: <Plus className="h-8 w-8 text-muted-foreground" />,
      title: copy.empty.agreementsTitle,
      description: filters.hasFilters
        ? "Intenta ajustar los filtros de búsqueda"
        : copy.empty.agreements,
      cta: canCreate
        ? {
            label: copy.actions.createAgreement,
            onClick: () => setAgreementDialogOpen(true),
          }
        : undefined,
      secondaryCta,
    };
  }, [canCreate, filters.clearAll, filters.hasFilters]);

  return (
    <>
      <ListPageShell
        title={copy.agreementsPage.title}
        description={copy.agreementsPage.description}
        primaryAction={
          canCreate
            ? {
                label: copy.actions.createAgreement,
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setAgreementDialogOpen(true),
              }
            : undefined
        }
        items={filteredAgreements}
        isLoading={isAgreementsLoading}
        entityLabelPlural="tarifas"
        emptyState={activeEmptyState}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.fields.searchPlaceholder,
          },
          onRefresh: handleRefresh,
          isRefreshing: isAgreementsFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
          viewMode: filters.viewModeProps,
          filters: (
            <Select
              value={employeeIdFilter || "all"}
              onValueChange={(val) =>
                filters.setFilter("employeeId", val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-48" aria-label="Filtrar por operador">
                <SelectValue placeholder="Todos los operadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los operadores</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        }}
        renderTable={() => (
          <CompensationAgreementsTable
            agreements={filteredAgreements}
            isLoading={isAgreementsLoading}
          />
        )}
        renderCards={() =>
          filteredAgreements.map((agr) => (
            <CompensationAgreementCard
              key={agr.id}
              agreement={agr}
              allAgreements={filteredAgreements}
            />
          ))
        }
        renderCardSkeleton={() => <CompensationAgreementCardSkeleton />}
      />

      <CompensationAgreementSheet
        open={agreementDialogOpen}
        onOpenChange={setAgreementDialogOpen}
        onSuccess={() => refetchAgreements()}
      />
    </>
  );
}
