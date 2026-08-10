/**
 * ImportsHubPage — historial de importaciones CSV en /settings/imports.
 */

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Upload } from "lucide-react";
import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
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
  IMPORT_ENTITY_TYPE_LABELS,
  IMPORT_IMPLEMENTED_ENTITY_TYPES,
  IMPORT_JOB_STATUSES,
  IMPORT_JOB_STATUS_LABELS,
  type ImportEntityType,
  type ImportJobStatus,
} from "../../domain";
import { useImportJobs } from "../../application";
import { ImportsJobsTable } from "../components/ImportsJobsTable";
import { MasterImportWizard } from "../components/MasterImportWizard";
import { importsCopy } from "../copy/importsCopy";

export function ImportsHubPage() {
  const copy = importsCopy.hub;
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);

  const canExecute = hasPermission("imports", "execute");

  const entityTypeFilter = searchParams.get("entity_type") as
    | ImportEntityType
    | null;
  const statusFilter = searchParams.get("status") as ImportJobStatus | null;
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const limit = 20;

  const listParams = useMemo(
    () => ({
      entityType: entityTypeFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit,
    }),
    [entityTypeFilter, statusFilter, page],
  );

  const { data, isLoading, isFetching, refetch } = useImportJobs(listParams);
  const jobs = data?.data ?? [];

  const setFilter = useCallback(
    (key: "entity_type" | "status", value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === "all") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        next.set("page", "1");
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("entity_type");
      next.delete("status");
      next.set("page", "1");
      return next;
    });
  }, [setSearchParams]);

  const hasFilters = Boolean(entityTypeFilter || statusFilter);

  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (entityTypeFilter) {
      chips.push({
        id: "entity_type",
        label: `${copy.filters.entityType}: ${IMPORT_ENTITY_TYPE_LABELS[entityTypeFilter] ?? entityTypeFilter}`,
        onRemove: () => setFilter("entity_type", "all"),
      });
    }
    if (statusFilter) {
      chips.push({
        id: "status",
        label: `${copy.filters.status}: ${IMPORT_JOB_STATUS_LABELS[statusFilter] ?? statusFilter}`,
        onRemove: () => setFilter("status", "all"),
      });
    }
    return chips;
  }, [entityTypeFilter, statusFilter, copy.filters, setFilter]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  return (
    <SettingsPageShell
      sectionTitle={copy.sectionTitle}
      title={copy.title}
      description={copy.description}
    >
      <ListPageShell
        title={copy.title}
        description={copy.description}
        showHeader={false}
        isLoading={isLoading}
        items={jobs}
        entityLabelPlural={copy.entityLabelPlural}
        pagination={
          data?.pagination
            ? {
                page: data.pagination.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit,
              }
            : undefined
        }
        onPageChange={(nextPage) => {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("page", String(nextPage));
            return next;
          });
        }}
        toolbar={{
          filters: (
            <>
              <Select
                value={entityTypeFilter || "all"}
                onValueChange={(value) => setFilter("entity_type", value)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={copy.filters.entityType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.entityTypeAll}</SelectItem>
                  {IMPORT_IMPLEMENTED_ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {IMPORT_ENTITY_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => setFilter("status", value)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={copy.filters.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.statusAll}</SelectItem>
                  {IMPORT_JOB_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {IMPORT_JOB_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ),
          extraActions: canExecute ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setWizardOpen(true)}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              {copy.newImport}
            </Button>
          ) : null,
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: clearFilters,
          hasFilters,
        }}
        emptyState={{
          icon: <Upload className="h-10 w-10 text-muted-foreground" />,
          title: copy.emptyTitle,
          description: copy.emptyDescription,
          cta: canExecute
            ? {
                label: copy.emptyAction,
                icon: <Upload className="h-4 w-4" />,
                onClick: () => setWizardOpen(true),
              }
            : undefined,
        }}
        renderTable={() => <ImportsJobsTable jobs={jobs} isLoading={isLoading} />}
      />

      <MasterImportWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        lockEntityType={false}
        onSuccess={() => {
          void refetch();
        }}
      />
    </SettingsPageShell>
  );
}
