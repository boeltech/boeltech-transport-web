import { useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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
 * El lookup vive en el search; importar y la vista no son recortes.
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
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  const hasActiveFilters = activePanelFilterCount > 0;
  const open = hasActiveFilters
    ? !userCollapsedWhileActive
    : userExpandedWhileIdle;

  const handleOpenChange = (next: boolean) => {
    if (hasActiveFilters) {
      setUserCollapsedWhileActive(!next);
      return;
    }
    setUserExpandedWhileIdle(next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="contents"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {copy.showFilters}
          {activePanelFilterCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
              {activePanelFilterCount}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="order-last w-full basis-full">
        <Card className="bg-muted/30">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <Label htmlFor="employees-filter-position">
                {copy.positionLabel}
              </Label>
              <Select
                value={position || "all"}
                onValueChange={onPositionChange}
              >
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
