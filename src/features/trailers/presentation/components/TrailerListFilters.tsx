import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import { TRAILER_STATUS_LABELS, TrailerStatus } from "../../domain";
import { trailersCopy } from "../copy/trailersCopy";

const filterCopy = trailersCopy.list.filter;

export interface TrailerListFiltersProps {
  status: string;
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
}

/**
 * Recortes del padrón de remolques (estado).
 * Shell canónico: `ListingFilterPanel`. El lookup vive en el search;
 * la vista tabla/cards no es recorte.
 */
export function TrailerListFilters({
  status,
  activePanelFilterCount,
  onStatusChange,
}: TrailerListFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={filterCopy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-1"
    >
      <div className="space-y-1.5">
        <Label htmlFor="trailers-filter-status">{filterCopy.statusLabel}</Label>
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger
            id="trailers-filter-status"
            className="w-full"
            aria-label={filterCopy.statusLabel}
          >
            <SelectValue placeholder={filterCopy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterCopy.statusAll}</SelectItem>
            {Object.values(TrailerStatus).map((statusValue) => (
              <SelectItem key={statusValue} value={statusValue}>
                {TRAILER_STATUS_LABELS[statusValue]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
