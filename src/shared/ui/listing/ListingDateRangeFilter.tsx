import { useCallback, useMemo, useState } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  formatListingDateRangeLabel,
  LISTING_DATE_RANGE_QUICK_PRESETS,
} from "./listingDateRangeUtils";

export interface ListingDateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onApply: (fromDate: string, toDate: string) => void;
  onClear: () => void;
  heading?: string;
  placeholder?: string;
  idPrefix?: string;
}

type DateDraftState = { fromDate: string; toDate: string };

const EMPTY_DATE_DRAFT: DateDraftState = { fromDate: "", toDate: "" };

export function ListingDateRangeFilter({
  fromDate,
  toDate,
  onApply,
  onClear,
  heading = "Filtrar por fecha",
  placeholder = "Filtrar por fecha",
  idPrefix = "listing-date",
}: ListingDateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState<DateDraftState>(EMPTY_DATE_DRAFT);

  const hasDateFilter = !!fromDate || !!toDate;

  const dateFilterText = useMemo(
    () => formatListingDateRangeLabel(fromDate, toDate, placeholder),
    [fromDate, placeholder, toDate],
  );

  const syncDateDraftFromApplied = useCallback(() => {
    setDateDraft({ fromDate, toDate });
  }, [fromDate, toDate]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        syncDateDraftFromApplied();
      }
    },
    [syncDateDraftFromApplied],
  );

  const dateDraftMatchesApplied = useMemo(
    () => dateDraft.fromDate === fromDate && dateDraft.toDate === toDate,
    [dateDraft, fromDate, toDate],
  );

  const handleApply = useCallback(() => {
    onApply(dateDraft.fromDate, dateDraft.toDate);
    setIsOpen(false);
  }, [dateDraft.fromDate, dateDraft.toDate, onApply]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    onClear();
    setDateDraft({ ...EMPTY_DATE_DRAFT });
    setIsOpen(false);
  }, [onClear]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={hasDateFilter ? "secondary" : "outline"}
          className={cn(
            "w-auto justify-start text-left font-normal",
            hasDateFilter && "pr-2",
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span className="max-w-[260px] truncate">{dateFilterText}</span>
          {hasDateFilter ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Quitar filtro de fechas"
              className="ml-2 rounded p-1 hover:bg-muted"
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  handleClear();
                }
              }}
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[24rem] p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="h-4 w-4" />
            {heading}
          </div>

          <div className="space-y-2 border-b pb-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-from`}>Desde</Label>
                <Input
                  id={`${idPrefix}-from`}
                  type="date"
                  value={dateDraft.fromDate}
                  max={dateDraft.toDate || undefined}
                  onChange={(event) =>
                    setDateDraft((draft) => ({
                      ...draft,
                      fromDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-to`}>Hasta</Label>
                <Input
                  id={`${idPrefix}-to`}
                  type="date"
                  value={dateDraft.toDate}
                  min={dateDraft.fromDate || undefined}
                  onChange={(event) =>
                    setDateDraft((draft) => ({
                      ...draft,
                      toDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Rango rápido</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateDraft(LISTING_DATE_RANGE_QUICK_PRESETS.today())
                }
              >
                Hoy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateDraft(LISTING_DATE_RANGE_QUICK_PRESETS.lastWeek())
                }
              >
                Última semana
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateDraft(LISTING_DATE_RANGE_QUICK_PRESETS.lastMonth())
                }
              >
                Último mes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDateDraft(LISTING_DATE_RANGE_QUICK_PRESETS.thisMonth())
                }
              >
                Este mes
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            {hasDateFilter ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start text-muted-foreground sm:order-1"
                onClick={handleClear}
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar fechas
              </Button>
            ) : (
              <span className="hidden sm:block sm:order-1" />
            )}
            <div className="flex w-full gap-2 sm:order-2 sm:w-auto sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 sm:flex-none"
                disabled={dateDraftMatchesApplied}
                onClick={handleApply}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
