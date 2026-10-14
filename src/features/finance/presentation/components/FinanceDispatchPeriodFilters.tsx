import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import {
  DISPATCH_RUN_STATUSES,
  type DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.tab.filters;
const ALL_OPTION = "all";

export interface FinanceDispatchPeriodSchemeOption {
  id: string;
  name: string;
}

export interface FinanceDispatchPeriodFiltersProps {
  status: string;
  billingSchemeId: string;
  schemes: readonly FinanceDispatchPeriodSchemeOption[];
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onSchemeChange: (value: string) => void;
}

/**
 * Recortes del listado de envíos del periodo (estado / frecuencia).
 * Shell canónico: `ListingFilterPanel`. Hide-empty vive fuera (toolbar).
 * Armar y Nueva frecuencia no son recortes; no hay lookup.
 */
export function FinanceDispatchPeriodFilters({
  status,
  billingSchemeId,
  schemes,
  activePanelFilterCount,
  onStatusChange,
  onSchemeChange,
}: FinanceDispatchPeriodFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="dispatch-period-status">{copy.statusLabel}</Label>
        <Select value={status || ALL_OPTION} onValueChange={onStatusChange}>
          <SelectTrigger
            id="dispatch-period-status"
            className="w-full"
            aria-label={copy.statusLabel}
          >
            <SelectValue placeholder={copy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>{copy.statusAll}</SelectItem>
            {DISPATCH_RUN_STATUSES.map((item: DispatchRunStatus) => (
              <SelectItem key={item} value={item}>
                {dispatchRunsCopy.status[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dispatch-period-scheme">{copy.schemeLabel}</Label>
        <Select
          value={billingSchemeId || ALL_OPTION}
          onValueChange={onSchemeChange}
        >
          <SelectTrigger
            id="dispatch-period-scheme"
            className="w-full"
            aria-label={copy.schemeLabel}
          >
            <SelectValue placeholder={copy.schemeLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>{copy.schemeAll}</SelectItem>
            {schemes.map((scheme) => (
              <SelectItem key={scheme.id} value={scheme.id}>
                {scheme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
