/**
 * Recortes del historial platform (acción + rango de fechas).
 * Shell canónico: `ListingFilterPanel`.
 */

import { Label } from "@shared/ui/label";
import {
  ListingDateRangeFilter,
  ListingFilterPanel,
} from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { PlatformAuditAction } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { getAuditActionLabel } from "../utils/platformAuditFormatters";

export interface PlatformAuditListFiltersProps {
  action: string;
  dateFrom: string;
  dateTo: string;
  activePanelFilterCount: number;
  onActionChange: (value: string) => void;
  onApplyDateRange: (fromDate: string, toDate: string) => void;
  onClearDateRange: () => void;
}

export function PlatformAuditListFilters({
  action,
  dateFrom,
  dateTo,
  activePanelFilterCount,
  onActionChange,
  onApplyDateRange,
  onClearDateRange,
}: PlatformAuditListFiltersProps) {
  const copy = platformCopy.audit.filters;

  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="platform-audit-filter-action">{copy.action}</Label>
        <Select
          value={action || "all"}
          onValueChange={(value) =>
            onActionChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger id="platform-audit-filter-action" className="w-full">
            <SelectValue placeholder={copy.action} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allActions}</SelectItem>
            {Object.values(PlatformAuditAction).map((value) => (
              <SelectItem key={value} value={value}>
                {getAuditActionLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>{copy.date}</Label>
        <ListingDateRangeFilter
          fromDate={dateFrom}
          toDate={dateTo}
          onApply={onApplyDateRange}
          onClear={onClearDateRange}
          heading={copy.dateHeading}
          placeholder={copy.datePlaceholder}
          idPrefix="platform-audit-date"
          triggerClassName="w-full"
        />
      </div>
    </ListingFilterPanel>
  );
}
