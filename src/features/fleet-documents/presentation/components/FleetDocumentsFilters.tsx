import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { cn } from "@shared/lib/utils/cn";
import {
  DOCUMENT_EXPIRY_WITHIN_DAYS_OPTIONS,
  DocumentExpiryDocType,
  DocumentExpiryStatus,
  type DocumentExpiryWithinDays,
} from "../../domain";
import { fleetDocumentsCopy } from "../copy";

const copy = fleetDocumentsCopy.filter;
const docTypeCopy = fleetDocumentsCopy.docType;
const statusCopy = fleetDocumentsCopy.status;

export interface FleetDocumentsFiltersProps {
  withinDays: DocumentExpiryWithinDays;
  docType: string;
  status: string;
  activePanelFilterCount: number;
  onWithinDaysChange: (days: DocumentExpiryWithinDays) => void;
  onDocTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function FleetDocumentsFilters({
  withinDays,
  docType,
  status,
  activePanelFilterCount,
  onWithinDaysChange,
  onDocTypeChange,
  onStatusChange,
}: FleetDocumentsFiltersProps) {
  return (
    <>
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label={copy.withinDaysLabel}
      >
        {DOCUMENT_EXPIRY_WITHIN_DAYS_OPTIONS.map((days) => {
          const selected = withinDays === days;
          return (
            <Button
              key={days}
              type="button"
              size="sm"
              variant={selected ? "secondary" : "outline"}
              aria-pressed={selected}
              aria-label={copy.withinDaysAria(days)}
              onClick={() => onWithinDaysChange(days)}
              className={cn(selected && "font-medium")}
            >
              {copy.withinDaysChip(days)}
            </Button>
          );
        })}
      </div>

      <ListingFilterPanel
        triggerLabel={copy.showFilters}
        activeCount={activePanelFilterCount}
        contentClassName="sm:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label htmlFor="fleet-docs-filter-doc-type">{copy.docTypeLabel}</Label>
          <Select value={docType || "all"} onValueChange={onDocTypeChange}>
            <SelectTrigger
              id="fleet-docs-filter-doc-type"
              className="w-full"
              aria-label={copy.docTypeLabel}
            >
              <SelectValue placeholder={copy.docTypeLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.docTypeAll}</SelectItem>
              {Object.values(DocumentExpiryDocType).map((value) => (
                <SelectItem key={value} value={value}>
                  {docTypeCopy[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fleet-docs-filter-status">{copy.statusLabel}</Label>
          <Select value={status || "all"} onValueChange={onStatusChange}>
            <SelectTrigger
              id="fleet-docs-filter-status"
              className="w-full"
              aria-label={copy.statusLabel}
            >
              <SelectValue placeholder={copy.statusLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.statusAll}</SelectItem>
              {Object.values(DocumentExpiryStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {statusCopy[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ListingFilterPanel>
    </>
  );
}
