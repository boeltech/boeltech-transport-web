/**
 * Recortes del workbench Envíos (Tipo ± periodo de emisión).
 * Shell canónico: `ListingFilterPanel` (paridad `/vehicles`).
 */

import { Label } from "@shared/ui/label";
import { ListingDateRangeFilter, ListingFilterPanel } from "@shared/ui/listing";
import type { DispatchDocumentKindFilter } from "@features/invoicing";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchDocumentKindFilter } from "./FinanceDispatchDocumentKindFilter";

const typeCopy = dispatchRunsCopy.workbench.typeFilter;
const sentFilters = dispatchRunsCopy.workbench.sent.filters;

export interface FinanceDispatchListFiltersProps {
  documentKind: DispatchDocumentKindFilter;
  activePanelFilterCount: number;
  onDocumentKindChange: (value: DispatchDocumentKindFilter) => void;
  /** Enviadas: periodo de emisión dentro del mismo panel. */
  showDateRange?: boolean;
  dateFrom?: string;
  dateTo?: string;
  onApplyDateRange?: (fromDate: string, toDate: string) => void;
  onClearDateRange?: () => void;
}

export function FinanceDispatchListFilters({
  documentKind,
  activePanelFilterCount,
  onDocumentKindChange,
  showDateRange = false,
  dateFrom = "",
  dateTo = "",
  onApplyDateRange,
  onClearDateRange,
}: FinanceDispatchListFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={typeCopy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName={showDateRange ? "sm:grid-cols-2" : "sm:grid-cols-1"}
    >
      <FinanceDispatchDocumentKindFilter
        value={documentKind}
        onChange={onDocumentKindChange}
      />

      {showDateRange && onApplyDateRange && onClearDateRange ? (
        <div className="space-y-1.5">
          <Label>{sentFilters.dateRangeHeading}</Label>
          <ListingDateRangeFilter
            fromDate={dateFrom}
            toDate={dateTo}
            onApply={onApplyDateRange}
            onClear={onClearDateRange}
            heading={sentFilters.dateRangeHeading}
            placeholder={sentFilters.dateRangePlaceholder}
            idPrefix="dispatch-sent-date"
            triggerClassName="w-full"
          />
        </div>
      ) : null}
    </ListingFilterPanel>
  );
}
