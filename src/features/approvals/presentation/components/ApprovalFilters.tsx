import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ListingDateRangeFilter } from "@shared/ui/listing";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryType,
} from "@features/trips/domain";
import { APPROVAL_STATUS_ALL } from "../utils/approvalInboxFilters";
import { APPROVAL_STATUS_LABELS, type ApprovalStatus } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox.filters;

interface ApprovalFiltersProps {
  status: ApprovalStatus | typeof APPROVAL_STATUS_ALL | "";
  category: string;
  fromDate: string;
  toDate: string;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onApplyDateRange: (fromDate: string, toDate: string) => void;
  onClearDateRange: () => void;
}

export function ApprovalFilters({
  status,
  category,
  fromDate,
  toDate,
  onStatusChange,
  onCategoryChange,
  onApplyDateRange,
  onClearDateRange,
}: ApprovalFiltersProps) {
  return (
    <>
      <Select
        value={status === "" || status === APPROVAL_STATUS_ALL ? "all" : status}
        onValueChange={onStatusChange}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={copy.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{copy.statusAll}</SelectItem>
          {(Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatus[]).map((key) => (
            <SelectItem key={key} value={key}>
              {APPROVAL_STATUS_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category || "all"} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder={copy.category} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{copy.categoryAll}</SelectItem>
          {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategoryType[]).map(
            (key) => (
              <SelectItem key={key} value={key}>
                {EXPENSE_CATEGORY_LABELS[key]}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <ListingDateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onApply={onApplyDateRange}
        onClear={onClearDateRange}
        heading={copy.dateFilterHeading}
        placeholder={copy.dateFilterPlaceholder}
        idPrefix="approvals-date"
      />
    </>
  );
}
