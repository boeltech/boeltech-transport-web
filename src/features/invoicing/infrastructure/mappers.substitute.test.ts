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

  it("maps amount corrections to snake_case", () => {
    expect(
      toApiSubstituteStampedInvoice({
        cancellationReason: "Importe incorrecto",
        corrections: { subtotal: 1100, totalTax: 176, total: 1276 },
      }),
    ).toEqual({
      cancellation_reason: "Importe incorrecto",
      corrections: {
        subtotal: 1100,
        total_tax: 176,
        total: 1276,
      },
    });
  });
});
