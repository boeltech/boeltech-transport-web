import { useState } from "react";
import { cn } from "@shared/lib/utils/cn";
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

export interface TripListFiltersProps {
  fiscalAttentionOnly: boolean;
  invoiceStatusFilter: TripInvoiceStatus | undefined;
  dateFrom: string;
  dateTo: string;
  /** Abre el panel cuando hay filtros activos en la URL. */
  hasActiveFilters: boolean;
  onFiscalAttentionChange: (attentionOnly: boolean) => void;
  onInvoiceStatusChange: (value: string) => void;
  onApplyDateRange: (fromDate: string, toDate: string) => void;
  onClearDateRange: () => void;
  /** Portal cliente: oculta filtros de atención/estado de factura. */
  hideInvoiceFilters?: boolean;
}

/**
 * Panel de filtros del listado de viajes (colapsable).
 * Cerrado por defecto; abierto si hay filtros activos (salvo que el usuario lo cierre).
 */
export function TripListFilters({
  fiscalAttentionOnly,
  invoiceStatusFilter,
  dateFrom,
  dateTo,
  hasActiveFilters,
  onFiscalAttentionChange,
  onInvoiceStatusChange,
  onApplyDateRange,
  onClearDateRange,
  hideInvoiceFilters = false,
}: TripListFiltersProps) {
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

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
    <div className="order-last w-full basis-full">
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              aria-expanded={open}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {open ? copy.hideFilters : copy.showFilters}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <Card className="bg-muted/30">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                {copy.panelTitle}
              </div>

              <div
                className={cn(
                  "grid gap-3 sm:grid-cols-2",
                  hideInvoiceFilters ? "lg:grid-cols-1" : "lg:grid-cols-3",
                )}
              >
                {!hideInvoiceFilters ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="trips-filter-fiscal">
                        {copy.fiscalLabel}
                      </Label>
                      <Select
                        value={fiscalAttentionOnly ? "yes" : "all"}
                        onValueChange={(value) =>
                          onFiscalAttentionChange(value === "yes")
                        }
                      >
                        <SelectTrigger
                          id="trips-filter-fiscal"
                          className="w-full"
                        >
                          <SelectValue placeholder={copy.fiscalPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{copy.fiscalAll}</SelectItem>
                          <SelectItem value="yes">
                            {copy.fiscalAttention}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="trips-filter-invoice">
                        {copy.invoiceLabel}
                      </Label>
                      <Select
                        value={invoiceStatusFilter ?? "all"}
                        onValueChange={onInvoiceStatusChange}
                      >
                        <SelectTrigger
                          id="trips-filter-invoice"
                          className="w-full"
                        >
                          <SelectValue placeholder={copy.invoicePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{copy.invoiceAll}</SelectItem>
                          {TRIP_INVOICE_STATUS_FILTER_VALUES.map(
                            (invoiceStatus) => (
                              <SelectItem
                                key={invoiceStatus}
                                value={invoiceStatus}
                              >
                                {tripsListCopy.invoiceStatus[invoiceStatus]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}

                <div className="space-y-1.5">
                  <Label>{copy.dateLabel}</Label>
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
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
