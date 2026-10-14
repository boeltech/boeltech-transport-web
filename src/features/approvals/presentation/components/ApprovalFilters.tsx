import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { ListingDateRangeFilter, ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
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
  /** ADR-0098 UX5: solo registros autoaprobados (`self_approved=true`). */
  selfApproved?: boolean;
  onSelfApprovedChange?: (value: boolean) => void;
}

/**
 * Recortes de la bandeja (estado, categoría, fecha).
 * Shell canónico: `ListingFilterPanel`. El tipo vive en el scorecard;
 * pending es la cola implícita; el lookup, en el search. La cola «Me toca · Todas»
 * y el filtro de operador viven fuera del panel (toolbar del workbench).
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
  selfApproved = false,
  onSelfApprovedChange,
}: ApprovalFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="approvals-filter-status">{copy.status}</Label>
        <Select
          value={
            status === "" || status === APPROVAL_STATUS_ALL ? "all" : status
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
          <Select value={category || "all"} onValueChange={onCategoryChange}>
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

      {onSelfApprovedChange ? (
        <div className="flex items-center gap-2 self-end pb-2">
          <Checkbox
            id="approvals-filter-self-approved"
            checked={selfApproved}
            onCheckedChange={(checked) =>
              onSelfApprovedChange(checked === true)
            }
          />
          <Label htmlFor="approvals-filter-self-approved">
            {approvalsCopy.selfApproval.filterChip}
          </Label>
        </div>
      ) : null}
    </ListingFilterPanel>
  );
}
