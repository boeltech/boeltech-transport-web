import { describe, expect, it } from "vitest";
import { toApiSubstituteStampedInvoice } from "./mappers";

describe("toApiSubstituteStampedInvoice", () => {
  it("maps payload without corrections", () => {
    expect(
      toApiSubstituteStampedInvoice({
        cancellationReason: "RFC incorrecto",
        notes: "Nota",
      }),
    ).toEqual({
      cancellation_reason: "RFC incorrecto",
      notes: "Nota",
    });
  });

  it("maps corrections to snake_case", () => {
    expect(
      toApiSubstituteStampedInvoice({
        cancellationReason: "RFC incorrecto",
        corrections: {
          receiverRfc: "AAA010101AAA",
          cfdiUsage: "S01",
        },
      }),
    ).toEqual({
      cancellation_reason: "RFC incorrecto",
      corrections: {
        receiver_rfc: "AAA010101AAA",
        cfdi_usage: "S01",
      },
    });
  });

  it("maps trip_corrections to snake_case", () => {
    expect(
      toApiSubstituteStampedInvoice({
        cancellationReason: "RFC parada incorrecto",
        corrections: {
          tripCorrections: [
            {
              tripId: "22222222-2222-2222-2222-222222222222",
              stopId: "44444444-4444-4444-4444-444444444444",
              rfcRemitenteDestinatario: "AAA010101AAA",
              reason: "RFC incorrecto en parada",
              propagateToClient: true,
            },
          ],
        },
      }),
    ).toEqual({
      cancellation_reason: "RFC parada incorrecto",
      corrections: {
        trip_corrections: [
          {
            trip_id: "22222222-2222-2222-2222-222222222222",
            stop_id: "44444444-4444-4444-4444-444444444444",
            rfc_remitente_destinatario: "AAA010101AAA",
            reason: "RFC incorrecto en parada",
            propagate_to_client: true,
          },
        ],
      },
    });
  });

  it("maps propagate_receiver_to_client flag", () => {
    expect(
      toApiSubstituteStampedInvoice({
        cancellationReason: "RFC incorrecto",
        corrections: {
          receiverRfc: "AAA010101AAA",
          propagateReceiverToClient: true,
        },
      }),
    ).toEqual({
      cancellation_reason: "RFC incorrecto",
      corrections: {
        receiver_rfc: "AAA010101AAA",
        propagate_receiver_to_client: true,
      },
    });
  });

  it("maps trip fiscal and address corrections", () => {
    expect(
      toApiSubstituteStampedInvoice({
        cancellationReason: "Corregir viaje",
        corrections: {
          tripCorrections: [
            {
              tripId: "22222222-2222-2222-2222-222222222222",
              driverId: "b3e959df-8689-4f4c-bff2-eb2122f1f7f6",
              vehicleId: "c3e959df-8689-4f4c-bff2-eb2122f1f7f6",
              reason: "Corregir operador y unidad",
            },
            {
              tripId: "22222222-2222-2222-2222-222222222222",
              stopId: "44444444-4444-4444-4444-444444444444",
              addressId: "d3e959df-8689-4f4c-bff2-eb2122f1f7f6",
              reason: "Corregir domicilio",
            },
          ],
        },
      }),
    ).toEqual({
      cancellation_reason: "Corregir viaje",
      corrections: {
        trip_corrections: [
          {
            trip_id: "22222222-2222-2222-2222-222222222222",
            driver_id: "b3e959df-8689-4f4c-bff2-eb2122f1f7f6",
            vehicle_id: "c3e959df-8689-4f4c-bff2-eb2122f1f7f6",
            reason: "Corregir operador y unidad",
          },
          {
            trip_id: "22222222-2222-2222-2222-222222222222",
            stop_id: "44444444-4444-4444-4444-444444444444",
            address_id: "d3e959df-8689-4f4c-bff2-eb2122f1f7f6",
            reason: "Corregir domicilio",
          },
        ],
      },
    });
  });
});
