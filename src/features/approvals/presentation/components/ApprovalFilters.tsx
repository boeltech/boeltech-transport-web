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
import { ListingDateRangeFilter } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryType,
} from "@features/trips/domain";
import { APPROVAL_STATUS_ALL } from "../utils/approvalInboxFilters";
import { APPROVAL_STATUS_LABELS, type ApprovalStatus } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox.filters;

export interface ApprovalFiltersProps {
  status: ApprovalStatus | typeof APPROVAL_STATUS_ALL | "";
  category: string;
  fromDate: string;
  toDate: string;
  /** Solo gastos de viaje: las categorías de gasto no aplican a anticipos ni liquidaciones. */
  showCategory: boolean;
  /** Recortes del panel (estado ≠ pending / categoría / fecha). No incluye search ni deep-links. */
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onApplyDateRange: (fromDate: string, toDate: string) => void;
  onClearDateRange: () => void;
}

/**
 * Recortes de la bandeja (estado, categoría, fecha).
 * El tipo vive en el scorecard; pending es la cola implícita; el lookup, en el search.
 */
export function ApprovalFilters({
  status,
  category,
  fromDate,
  toDate,
  showCategory,
  activePanelFilterCount,
  onStatusChange,
  onCategoryChange,
  onApplyDateRange,
  onClearDateRange,
}: ApprovalFiltersProps) {
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
              <Label htmlFor="approvals-filter-status">{copy.status}</Label>
              <Select
                value={
                  status === "" || status === APPROVAL_STATUS_ALL
                    ? "all"
                    : status
                }
                onValueChange={onStatusChange}
              >
                <SelectTrigger
                  id="approvals-filter-status"
                  className="w-full"
                  aria-label={copy.status}
                >
                  <SelectValue placeholder={copy.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.statusAll}</SelectItem>
                  {(Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatus[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {APPROVAL_STATUS_LABELS[key]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {showCategory ? (
              <div className="space-y-1.5">
                <Label htmlFor="approvals-filter-category">{copy.category}</Label>
                <Select
                  value={category || "all"}
                  onValueChange={onCategoryChange}
                >
                  <SelectTrigger
                    id="approvals-filter-category"
                    className="w-full"
                    aria-label={copy.category}
                  >
                    <SelectValue placeholder={copy.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{copy.categoryAll}</SelectItem>
                    {(
                      Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategoryType[]
                    ).map((key) => (
                      <SelectItem key={key} value={key}>
                        {EXPENSE_CATEGORY_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>{copy.dateLabel}</Label>
              <ListingDateRangeFilter
                fromDate={fromDate}
                toDate={toDate}
                onApply={onApplyDateRange}
                onClear={onClearDateRange}
                heading={copy.dateFilterHeading}
                placeholder={copy.dateFilterPlaceholder}
                idPrefix="approvals-date"
                triggerClassName="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
