import { Label } from "@shared/ui/label";
import { ListingDateRangeFilter, ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import type { TripInvoiceStatus } from "../../domain";
import { tripsListCopy } from "../copy/listCopy";

const copy = tripsListCopy.filter;

const TRIP_INVOICE_STATUS_FILTER_VALUES: TripInvoiceStatus[] = [
  "draft",
  "stamping",
  "stamped",
  "cancellation_pending",
  "cancelled",
];

export interface TripListOriginBranchOption {
  value: string;
  label: string;
}

export interface TripListFiltersProps {
  invoiceStatusFilter: TripInvoiceStatus | undefined;
  dateFrom: string;
  dateTo: string;
  originBranchId: string;
  originBranchOptions: TripListOriginBranchOption[];
  /** Recortes del panel (factura / fecha / sucursal). No incluye search ni overdue. */
  activePanelFilterCount: number;
  onInvoiceStatusChange: (value: string) => void;
  onApplyDateRange: (fromDate: string, toDate: string) => void;
  onClearDateRange: () => void;
  onOriginBranchChange: (value: string) => void;
  /** Portal cliente/conductor: solo fecha, always-on. */
  variant?: "fleet" | "lean";
}

function DateFilterField({
  dateFrom,
  dateTo,
  onApplyDateRange,
  onClearDateRange,
  showLabel = true,
}: Pick<
  TripListFiltersProps,
  "dateFrom" | "dateTo" | "onApplyDateRange" | "onClearDateRange"
> & { showLabel?: boolean }) {
  return (
    <div className={showLabel ? "space-y-1.5" : undefined}>
      {showLabel ? <Label>{copy.dateLabel}</Label> : null}
      <ListingDateRangeFilter
        fromDate={dateFrom}
        toDate={dateTo}
        onApply={onApplyDateRange}
        onClear={onClearDateRange}
        heading={copy.dateHeading}
        placeholder={copy.datePlaceholder}
        idPrefix="trips-date"
        triggerClassName="w-full"
      />
    </div>
  );
}

/**
 * Recortes de listado (factura / fecha / sucursal).
 * Shell canónico: `ListingFilterPanel`. La cola (Reservas, Atención fiscal)
 * vive en el scorecard; el retraso es un toggle aparte.
 */
export function TripListFilters({
  invoiceStatusFilter,
  dateFrom,
  dateTo,
  originBranchId,
  originBranchOptions,
  activePanelFilterCount,
  onInvoiceStatusChange,
  onApplyDateRange,
  onClearDateRange,
  onOriginBranchChange,
  variant = "fleet",
}: TripListFiltersProps) {
  if (variant === "lean") {
    return (
      <div className="w-full min-w-[12rem] sm:w-auto sm:min-w-[16rem]">
        <DateFilterField
          dateFrom={dateFrom}
          dateTo={dateTo}
          onApplyDateRange={onApplyDateRange}
          onClearDateRange={onClearDateRange}
          showLabel={false}
        />
      </div>
    );
  }

  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="trips-filter-invoice">{copy.invoiceLabel}</Label>
        <Select
          value={invoiceStatusFilter ?? "all"}
          onValueChange={onInvoiceStatusChange}
        >
          <SelectTrigger id="trips-filter-invoice" className="w-full">
            <SelectValue placeholder={copy.invoicePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.invoiceAll}</SelectItem>
            {TRIP_INVOICE_STATUS_FILTER_VALUES.map((invoiceStatus) => (
              <SelectItem key={invoiceStatus} value={invoiceStatus}>
                {tripsListCopy.invoiceStatus[invoiceStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DateFilterField
        dateFrom={dateFrom}
        dateTo={dateTo}
        onApplyDateRange={onApplyDateRange}
        onClearDateRange={onClearDateRange}
      />

      <div className="space-y-1.5">
        <Label htmlFor="trips-filter-origin-branch">
          {copy.originBranchLabel}
        </Label>
        <Select
          value={originBranchId || "all"}
          onValueChange={onOriginBranchChange}
        >
          <SelectTrigger id="trips-filter-origin-branch" className="w-full">
            <SelectValue placeholder={copy.originBranchPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.originBranchAll}</SelectItem>
            <SelectItem value="unassigned">
              {copy.originBranchUnassigned}
            </SelectItem>
            {originBranchOptions.map((option) => (
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
