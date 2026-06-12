import { useCallback, useState } from "react";
import { createGetTripsUseCase } from "@features/trips/application";
import type { IGetTripsUseCase } from "@features/trips/application/useCases/trip/GetTripsUseCase";
import { tripRepository } from "@features/trips/infrastructure";
import type { TripListItem, TripQueryParams } from "@features/trips/domain";
import { downloadCsv } from "@shared/utils/exportCsv";
import { useToast } from "@shared/hooks";
import { reportsCopy } from "../copy/reportsCopy";
import {
  getTripExportHeaders,
  mapTripsToCsvRows,
  type TripExportFilters,
} from "./tripExportHelpers";

/** Máximo permitido por la API de viajes (`tripQuerySchema`). */
const EXPORT_PAGE_LIMIT = 100;

function buildTripQueryParams(
  filters: TripExportFilters,
  page: number,
): TripQueryParams {
  return {
    page,
    limit: EXPORT_PAGE_LIMIT,
    filters: {
      status: filters.status,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      search: filters.search?.trim() || undefined,
    },
    sort: {
      field: "scheduled_departure",
      direction: "desc",
    },
  };
}

export async function fetchAllTripsForExport(
  getTripsUseCase: IGetTripsUseCase,
  filters: TripExportFilters,
): Promise<TripListItem[]> {
  const trips: TripListItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await getTripsUseCase.execute(buildTripQueryParams(filters, page));
    if (!result.success) {
      throw new Error(result.error.message);
    }

    trips.push(...result.data.data);
    totalPages = result.data.pagination.totalPages;
    page += 1;
  }

  return trips;
}

function nowDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useExportTrips() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportTrips = useCallback(
    async (filters: TripExportFilters) => {
      setIsExporting(true);
      try {
        const getTripsUseCase = createGetTripsUseCase(tripRepository);
        const trips = await fetchAllTripsForExport(getTripsUseCase, filters);

        if (trips.length === 0) {
          toast({
            title: reportsCopy.trips.toast.empty,
            variant: "destructive",
          });
          return;
        }

        downloadCsv(
          `${reportsCopy.trips.filePrefix}-${nowDateKey()}.csv`,
          getTripExportHeaders(),
          mapTripsToCsvRows(trips),
        );

        toast({
          title: reportsCopy.trips.toast.success,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: reportsCopy.trips.toast.error,
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [toast],
  );

  return { exportTrips, isExporting };
}
