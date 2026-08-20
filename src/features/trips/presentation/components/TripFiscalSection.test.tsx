import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { TripFiscalSection, shouldShowTripFiscalBand } from "./TripFiscalSection";

function makeTrip(
  invoicingOverrides: Parameters<typeof tripInvoicingFixture>[0] = {},
) {
  return {
    id: "trip-1",
    status: TripStatus.SCHEDULED,
    invoicing: tripInvoicingFixture(invoicingOverrides),
  } as Parameters<typeof TripFiscalSection>[0]["trip"];
}

describe("TripFiscalSection — block_reason operación/SAT", () => {
  it("shows route block reason and link to Ruta tab", () => {
    render(
      <MemoryRouter>
        <TripFiscalSection
          trip={makeTrip({
            canGenerateInvoice: false,
            blockReason:
              "Completa la ruta: se necesitan al menos dos paradas listas para Carta Porte (pestaña Ruta).",
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/dos paradas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir a Ruta/i })).toHaveAttribute(
      "href",
      "/trips/trip-1?tab=route",
    );
  });

  it("shows cargo block reason and link to Carga tab", () => {
    render(
      <MemoryRouter>
        <TripFiscalSection
          trip={makeTrip({
            canGenerateInvoice: false,
            blockReason:
              "Captura al menos una carga (mercancía) antes de generar la factura (pestaña Carga).",
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/mercancía/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ir a Cargas/i })).toHaveAttribute(
      "href",
      "/trips/trip-1?tab=cargo",
    );
  });
});

describe("shouldShowTripFiscalBand", () => {
  it("hides the band when there is only a folio", () => {
    expect(
      shouldShowTripFiscalBand(
        makeTrip({
          invoiceId: "inv-1",
          invoiceFolio: "A-1",
          invoiceStatus: "stamped",
          hasActiveInvoice: true,
        }),
        false,
      ),
    ).toBe(false);
  });

  it("shows the band when billing is blocked on a completed trip", () => {
    const trip = {
      ...makeTrip({
        canGenerateInvoice: false,
        blockReason: "Falta una carga para facturar.",
      }),
      status: TripStatus.COMPLETED,
    };
    expect(shouldShowTripFiscalBand(trip, false)).toBe(true);
  });

  it("shows the band after cancel with pending fiscal action", () => {
    expect(shouldShowTripFiscalBand(makeTrip(), true)).toBe(true);
  });
});
