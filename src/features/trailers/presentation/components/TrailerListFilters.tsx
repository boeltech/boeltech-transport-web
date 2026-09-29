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
 * El lookup vive en el search; la vista tabla/cards no es recorte.
 */
export function TrailerListFilters({
  status,
  activePanelFilterCount,
  onStatusChange,
}: TrailerListFiltersProps) {
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
          {filterCopy.showFilters}
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
          <CardContent className="grid gap-3 p-4">
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
