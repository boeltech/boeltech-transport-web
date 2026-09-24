import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { TripStatus } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { TripFiscalSection } from "./TripFiscalSection";
import {
  shouldShowTripFiscalBand,
  shouldShowTripInvoicingConsole,
} from "./shouldShowTripInvoicingConsole";

function makeTrip(
  invoicingOverrides: Parameters<typeof tripInvoicingFixture>[0] = {},
  status: (typeof TripStatus)[keyof typeof TripStatus] = TripStatus.SCHEDULED,
  cfdiEmissionIntent: "emitir_cfdi" | "sin_cfdi_efectivo" = "emitir_cfdi",
) {
  return {
    id: "trip-1",
    status,
    requiresFiscalAttention: false,
    operationalOutcome: "standard" as const,
    cfdiEmissionIntent,
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

  it("false_trip stamped: badge Facturado + Abrir, sin mutex Pendiente", () => {
    render(
      <MemoryRouter>
        <TripFiscalSection
          trip={{
            ...makeTrip(
              {
                canGenerateInvoice: false,
                canGenerateAccessoryInvoice: false,
                canGenerateFalseTripInvoice: false,
                hasActiveInvoice: false,
                hasActivePrimaryInvoice: false,
                hasActivePrincipalInvoice: true,
                invoiceId: "inv-falso-1",
                invoiceFolio: "B8S-99",
                invoiceStatus: "stamped",
                blockReason:
                  "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.",
              },
              TripStatus.COMPLETED,
            ),
            operationalOutcome: "false_trip",
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Facturado")).toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
    expect(screen.getByText(/Folio B8S-99/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir/i })).toHaveAttribute(
      "href",
      "/invoices/inv-falso-1",
    );
    expect(
      screen.queryByText(/ya tiene una factura activa/i),
    ).not.toBeInTheDocument();
  });
});

describe("shouldShowTripInvoicingConsole (PD2)", () => {
  it("hides console when only canGenerateInvoice (CTAs viven en menú)", () => {
    const trip = makeTrip(
      {
        canGenerateInvoice: true,
        blockReason: null,
      },
      TripStatus.COMPLETED,
    );
    expect(shouldShowTripInvoicingConsole(trip, false)).toBe(false);
    expect(shouldShowTripFiscalBand(trip, false)).toBe(false);
  });

  it("shows console when split is active even without blockReason", () => {
    const trip = makeTrip(
      {
        hasActiveSplit: true,
        splitLegsInvoiced: 1,
        splitLegsTotal: 2,
        canGenerateSplitShareInvoice: true,
      },
      TripStatus.COMPLETED,
    );
    expect(shouldShowTripInvoicingConsole(trip, false)).toBe(true);
  });

  it("shows the band when billing is blocked on a completed trip", () => {
    const trip = makeTrip(
      {
        canGenerateInvoice: false,
        blockReason: "Falta una carga para facturar.",
      },
      TripStatus.COMPLETED,
    );
    expect(shouldShowTripInvoicingConsole(trip, false)).toBe(true);
  });

  it("shows the band after cancel with pending fiscal action", () => {
    expect(shouldShowTripInvoicingConsole(makeTrip(), true)).toBe(true);
  });

  it("hides console on scheduled trip with no fiscal signal", () => {
    expect(shouldShowTripInvoicingConsole(makeTrip(), false)).toBe(false);
  });

  it("hides empty shell on scheduled trip ready to bill without invoices/split", () => {
    expect(
      shouldShowTripInvoicingConsole(
        makeTrip(
          {
            canGenerateInvoice: true,
            blockReason: null,
          },
          TripStatus.SCHEDULED,
        ),
        false,
      ),
    ).toBe(false);
  });


  it("hides empty shell when only canGenerateSplitShareInvoice (CTAs en menú)", () => {
    expect(
      shouldShowTripInvoicingConsole(
        makeTrip(
          {
            canGenerateSplitShareInvoice: true,
            hasActiveSplit: false,
            splitLegsTotal: 0,
          },
          TripStatus.SCHEDULED,
        ),
        false,
      ),
    ).toBe(false);
  });

  it("shows console when only a linked folio exists (facturas ligadas)", () => {
    expect(
      shouldShowTripInvoicingConsole(
        makeTrip({
          invoiceId: "inv-1",
          invoiceFolio: "A-1",
          invoiceStatus: "stamped",
          hasActiveInvoice: true,
        }),
        false,
      ),
    ).toBe(true);
  });

  it("ADR-0096: hides console on sin_cfdi even when block_reason is set", () => {
    expect(
      shouldShowTripInvoicingConsole(
        makeTrip(
          {
            canGenerateInvoice: false,
            blockReason:
              "Este viaje se liquida sin CFDI; no se crea ni timbra factura.",
          },
          TripStatus.SCHEDULED,
          "sin_cfdi_efectivo",
        ),
        false,
      ),
    ).toBe(false);
  });

  it("ADR-0096: TripFiscalSection returns null for sin_cfdi without invoices", () => {
    const { container } = render(
      <MemoryRouter>
        <TripFiscalSection
          trip={makeTrip(
            {
              canGenerateInvoice: false,
              blockReason:
                "Este viaje se liquida sin CFDI; no se crea ni timbra factura.",
            },
            TripStatus.SCHEDULED,
            "sin_cfdi_efectivo",
          )}
        />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
