import { useState } from "react";
import { useTrips } from "@features/trips/application";
import type { TripListItem } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { ListingPagination, ListingSearchInput } from "@shared/ui/listing";
import { useDebounce } from "@shared/hooks";
import { formatDate, formatTime } from "@shared/utils/dateUtils";
import { tripsListCopy } from "../copy/listCopy";
import { formatCurrency, formatRoute } from "../uiHelpers";

const copy = tripsListCopy.invoiceablePicker;
const PAGE_SIZE = 10;

export interface InvoiceableTripPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tripId: string) => void;
}

function TripPickerRow({
  trip,
  onSelect,
}: {
  trip: TripListItem;
  onSelect: (tripId: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 space-y-1">
        <p className="font-mono text-sm font-medium">{trip.tripCode}</p>
        <p className="text-xs text-muted-foreground">
          {formatRoute(trip.originCity, trip.destinationCity)}
        </p>
        <p className="text-xs text-muted-foreground">
          {trip.client?.legalName ?? "Sin cliente"} ·{" "}
          {formatDate(trip.scheduledDeparture.toISOString().split("T")[0])}{" "}
          {formatTime(trip.scheduledDeparture.toISOString())}
        </p>
        <p className="text-xs font-medium">
          {copy.columns.baseRate}: {formatCurrency(trip.baseRate)}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => onSelect(trip.id)}
      >
        {copy.selectAction}
      </Button>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function InvoiceableTripPickerSheet({
  open,
  onOpenChange,
  onSelect,
}: InvoiceableTripPickerSheetProps) {
  const [searchInput, setSearchInput] = useState("");
  const [pageState, setPageState] = useState({ search: "", page: 1 });
  const debouncedSearch = useDebounce(searchInput, 300);

  const page =
    pageState.search === debouncedSearch ? pageState.page : 1;

  const setPage = (nextPage: number) => {
    setPageState({ search: debouncedSearch, page: nextPage });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchInput("");
      setPageState({ search: "", page: 1 });
    }
    onOpenChange(nextOpen);
  };

  const { data, isLoading, isError } = useTrips(
    {
      page,
      limit: PAGE_SIZE,
      filters: {
        invoiceableOnly: true,
        search: debouncedSearch || undefined,
      },
      sort: { field: "scheduled_departure", direction: "desc" },
    },
    { enabled: open },
  );

  const trips = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSelect = (tripId: string) => {
    onSelect(tripId);
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 py-4">
          <ListingSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder={copy.searchPlaceholder}
          />

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {isLoading ? (
              <LoadingRows />
            ) : isError ? (
              <p className="text-sm text-destructive">{copy.loadError}</p>
            ) : trips.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              trips.map((trip) => (
                <TripPickerRow
                  key={trip.id}
                  trip={trip}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <ListingPagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
