import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { tripQueryKeys, type TrackingEvent, type Trip } from "@features/trips/domain";

import { patchCargosFromTrackingEvents } from "./syncTripDetailFromTimeline";

/**
 * Cuando el timeline gana un evento de carga, el historial lo pinta en ese
 * mismo refresco. «Qué sigue» lee el estado de la carga en el detalle, que
 * no se vuelve a pedir hasta que vence su caché. Aquí se parchea ese estado
 * en el mismo instante y se pide el detalle para confirmarlo.
 *
 * La primera foto del timeline no parchea: esos eventos ya estaban al abrir
 * la pantalla. Solo los que llegan después.
 */
export function useSyncTripDetailOnTimelineEvents(
  tripId: string,
  events: readonly TrackingEvent[] | undefined,
): () => void {
  const queryClient = useQueryClient();
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!tripId || events === undefined) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(events.map((event) => event.id));
      return;
    }

    const fresh = events.filter((event) => !seenIds.current?.has(event.id));
    for (const event of events) {
      seenIds.current.add(event.id);
    }
    if (fresh.length === 0) return;

    queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
      if (!previous?.cargos) return previous;
      const cargos = patchCargosFromTrackingEvents(previous.cargos, fresh);
      if (!cargos) return previous;
      return { ...previous, cargos };
    });

    void queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    });
  }, [events, queryClient, tripId]);

  return () => {
    void queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    });
  };
}
