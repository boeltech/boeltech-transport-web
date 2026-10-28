import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  usePlatformTenant,
  usePlatformTenants,
} from "../../application/hooks/usePlatformTenants";
import { platformCopy } from "../copy/platformCopy";
import {
  OpsCommand,
  OpsCommandEmpty,
  OpsCommandGroup,
  OpsCommandInput,
  OpsCommandItem,
  OpsCommandList,
} from "./ui/OpsCommand";
import { OpsButton } from "./ui/OpsButton";
import { OpsInput } from "./ui/OpsInput";
import {
  OpsDialog,
  OpsDialogContent,
  OpsDialogHeader,
  OpsDialogTitle,
} from "./ui/OpsDialog";

export interface OpsArFiltersProps {
  periodKey: string;
  tenantId: string;
  onPeriodKeyChange: (value: string) => void;
  onTenantIdChange: (value: string) => void;
}

/**
 * Filtros AR dark Ops — mes + empresa (sin ListingFilterPanel / Card light).
 */
export function OpsArFilters({
  periodKey,
  tenantId,
  onPeriodKeyChange,
  onTenantIdChange,
}: OpsArFiltersProps) {
  const copy = platformCopy.ar.filters;
  const [tenantOpen, setTenantOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: listData, isFetching } = usePlatformTenants({
    search: search.trim() || undefined,
    limit: 25,
    page: 1,
  });
  const { data: selectedTenant } = usePlatformTenant(tenantId);
  const tenants = useMemo(() => listData?.data ?? [], [listData?.data]);

  const selectedLabel = useMemo(() => {
    if (!tenantId) return null;
    if (selectedTenant) {
      return `${selectedTenant.name} (${selectedTenant.subdomain})`;
    }
    const fromList = tenants.find((t) => t.id === tenantId);
    if (fromList) return `${fromList.name} (${fromList.subdomain})`;
    return tenantId.slice(0, 8);
  }, [tenantId, selectedTenant, tenants]);

  return (
    <div className="ops-money-filters" data-testid="ops-ar-filters">
      <div className="ops-money-filter-field">
        <label className="ops-label" htmlFor="ops-ar-period">
          {copy.periodKey}
        </label>
        <OpsInput
          id="ops-ar-period"
          className="w-[130px]"
          placeholder="AAAA-MM"
          value={periodKey}
          onChange={(e) => onPeriodKeyChange(e.target.value)}
        />
      </div>
      <div className="ops-money-filter-field">
        <span className="ops-label">{copy.tenant}</span>
        <div className="flex items-center gap-1">
          <OpsButton
            type="button"
            size="sm"
            variant="ghost"
            className="min-w-[10rem] justify-between"
            onClick={() => setTenantOpen(true)}
            aria-expanded={tenantOpen}
          >
            <span className={cn("truncate", !selectedLabel && "ops-text-muted")}>
              {selectedLabel ?? copy.tenantPlaceholder}
            </span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-60" />
          </OpsButton>
          {tenantId ? (
            <OpsButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={copy.tenantClear}
              onClick={() => onTenantIdChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </OpsButton>
          ) : null}
        </div>
      </div>

      <OpsDialog open={tenantOpen} onOpenChange={setTenantOpen}>
        <OpsDialogContent tone="default" className="sm:max-w-md">
          <OpsDialogHeader>
            <OpsDialogTitle>{copy.tenant}</OpsDialogTitle>
          </OpsDialogHeader>
          <OpsCommand shouldFilter={false}>
            <OpsCommandInput
              placeholder={copy.tenantPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <OpsCommandList>
              {isFetching ? (
                <div className="flex items-center gap-2 px-3 py-2 text-xs ops-text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {copy.tenantSearching}
                </div>
              ) : null}
              <OpsCommandEmpty>{copy.tenantEmpty}</OpsCommandEmpty>
              <OpsCommandGroup>
                {tenants.map((t) => (
                  <OpsCommandItem
                    key={t.id}
                    value={t.id}
                    onSelect={() => {
                      onTenantIdChange(t.id);
                      setTenantOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5",
                        t.id === tenantId ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">
                      {t.name}{" "}
                      <span className="ops-text-muted ops-font-mono text-[11px]">
                        ({t.subdomain})
                      </span>
                    </span>
                  </OpsCommandItem>
                ))}
              </OpsCommandGroup>
            </OpsCommandList>
          </OpsCommand>
        </OpsDialogContent>
      </OpsDialog>
    </div>
  );
}
