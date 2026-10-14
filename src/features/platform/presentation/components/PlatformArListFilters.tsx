/**
 * Recortes secundarios del ledger AR (periodo + empresa).
 * Chips de vista viven fuera del panel (D6).
 */

import { Label } from "@shared/ui/label";
import { MonthField } from "@shared/ui/form";
import { ListingFilterPanel } from "@shared/ui/listing";
import { ArTenantFilter } from "./ArTenantFilter";
import { platformCopy } from "../copy/platformCopy";

export interface PlatformArListFiltersProps {
  periodKey: string;
  tenantId: string;
  activePanelFilterCount: number;
  onPeriodKeyChange: (value: string) => void;
  onTenantIdChange: (value: string) => void;
}

export function PlatformArListFilters({
  periodKey,
  tenantId,
  activePanelFilterCount,
  onPeriodKeyChange,
  onTenantIdChange,
}: PlatformArListFiltersProps) {
  const copy = platformCopy.ar.filters;

  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="ar-period-key">{copy.periodKey}</Label>
        <MonthField
          id="ar-period-key"
          className="h-9 w-full"
          placeholder={copy.periodKeyPlaceholder}
          value={periodKey}
          onChange={onPeriodKeyChange}
          clearable
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ar-tenant-filter">{copy.tenant}</Label>
        <ArTenantFilter
          id="ar-tenant-filter"
          value={tenantId}
          onChange={onTenantIdChange}
        />
      </div>
    </ListingFilterPanel>
  );
}
