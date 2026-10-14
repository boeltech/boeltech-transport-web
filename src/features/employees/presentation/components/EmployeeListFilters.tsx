import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import type { EmployeeStatus, EmploymentType } from "../../domain/entities";
import { POSITION_OPTIONS } from "../config/employeeCatalogs";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
} from "../config/employeeConfig";
import { employeesCopy } from "../copy/employeesCopy";

const copy = employeesCopy.list.filter;

export interface EmployeeListFiltersProps {
  status: string;
  type: string;
  position: string;
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPositionChange: (value: string) => void;
}

/**
 * Recortes del catálogo de empleados (estado / contrato / puesto).
 * Shell canónico: `ListingFilterPanel`. El lookup vive en el search.
 */
export function EmployeeListFilters({
  status,
  type,
  position,
  activePanelFilterCount,
  onStatusChange,
  onTypeChange,
  onPositionChange,
}: EmployeeListFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="employees-filter-status">{copy.statusLabel}</Label>
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger
            id="employees-filter-status"
            className="w-full"
            aria-label={copy.statusLabel}
          >
            <SelectValue placeholder={copy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.statusAll}</SelectItem>
            {(Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {EMPLOYEE_STATUS_LABELS[key]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employees-filter-type">{copy.typeLabel}</Label>
        <Select value={type || "all"} onValueChange={onTypeChange}>
          <SelectTrigger
            id="employees-filter-type"
            className="w-full"
            aria-label={copy.typeLabel}
          >
            <SelectValue placeholder={copy.typeLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.typeAll}</SelectItem>
            {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {EMPLOYMENT_TYPE_LABELS[key]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employees-filter-position">{copy.positionLabel}</Label>
        <Select value={position || "all"} onValueChange={onPositionChange}>
          <SelectTrigger
            id="employees-filter-position"
            className="w-full"
            aria-label={copy.positionLabel}
          >
            <SelectValue placeholder={copy.positionLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.positionAll}</SelectItem>
            {POSITION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
