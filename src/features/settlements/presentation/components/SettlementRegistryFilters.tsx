import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import {
  SETTLEMENT_STATUS_LABELS,
  type SettlementStatus,
} from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.registry.filters;

export interface SettlementRegistryFiltersProps {
  status: string;
  employeeId: string;
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onEmployeeChange: (employeeId: string) => void;
}

/**
 * Recortes del historial (estado + operador).
 * Shell canónico: `ListingFilterPanel`. Search vive fuera (toolbar).
 */
export function SettlementRegistryFilters({
  status,
  employeeId,
  activePanelFilterCount,
  onStatusChange,
  onEmployeeChange,
}: SettlementRegistryFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="settlements-registry-status">{copy.statusLabel}</Label>
        <Select
          value={status || "all"}
          onValueChange={(val) => onStatusChange(val === "all" ? "" : val)}
        >
          <SelectTrigger
            id="settlements-registry-status"
            className="w-full"
            aria-label={copy.statusLabel}
          >
            <SelectValue placeholder={copy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.statusAll}</SelectItem>
            {(Object.keys(SETTLEMENT_STATUS_LABELS) as SettlementStatus[]).map(
              (st) => (
                <SelectItem key={st} value={st}>
                  {SETTLEMENT_STATUS_LABELS[st]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="settlements-registry-employee-filter">
          {copy.operatorLabel}
        </Label>
        <EmployeeAsyncCombobox
          id="settlements-registry-employee-filter"
          className="w-full"
          value={employeeId}
          onChange={onEmployeeChange}
          placeholder={copy.operatorAll}
          allowClear
        />
      </div>
    </ListingFilterPanel>
  );
}
