import { useClient } from "@features/clients";
import { useTrip } from "@features/trips";
import type { ClientType } from "@features/clients/domain";
import type { Invoice } from "../../domain";

type InvoiceReceiverClientSource = Pick<Invoice, "trips"> | undefined;

/**
 * Tipo de receptor para reglas de retención PM, alineado a API
 * (`resolveReceiverClientType`).
 *
 * Política vigente (OP-L0.3): se ancla al tipo del cliente del primer viaje
 * vinculado (`clients.type`), no al RFC editado del comprobante. Un cambio de
 * ancla viaje↔RFC es decisión de proceso de negocio, no de este hook.
 */
export function useInvoiceReceiverClientType(
  invoice: InvoiceReceiverClientSource,
): {
  clientType: ClientType | null;
  isResolving: boolean;
} {
  const tripId = invoice?.trips[0]?.tripId ?? "";
  const hasLinkedTrip = Boolean(tripId);

  const { data: trip, isLoading: isTripLoading } = useTrip(tripId, {
    enabled: hasLinkedTrip,
  });

  const clientId = trip?.clientId ?? trip?.client?.id;
  const { data: client, isLoading: isClientLoading } = useClient(clientId, {
    enabled: Boolean(clientId),
  });

  const isResolving =
    hasLinkedTrip &&
    (isTripLoading || (Boolean(clientId) && isClientLoading));

  return {
    clientType: client?.type ?? null,
    isResolving,
  };
}
