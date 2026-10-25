import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "../../test/tripInvoicingFixture";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { TripInvoicingConsole } from "./TripInvoicingConsole";

vi.mock("./TripFiscalSection", () => ({
  TripFiscalSection: () => <div data-testid="fiscal-section" />,
}));

vi.mock("./TripRevenueSplitSummaryLine", () => ({
  TripRevenueSplitSummaryLine: () => <div data-testid="split-line" />,
}));

const sectionCopy = tripFiscalCopy.invoicesSection;

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-mid-1",
    status: TripStatus.IN_PROGRESS,
    requiresFiscalAttention: false,
    cfdiEmissionIntent: "con_cfdi",
    invoicing: tripInvoicingFixture({
      hasActiveInvoice: true,
      invoiceId: "inv-1",
      invoiceFolio: "A-1",
      invoiceStatus: "stamped",
    }),
    ...overrides,
  } as Trip;
}

describe("TripInvoicingConsole (F4 densidad)", () => {
  it("in_progress sin ATF: consola secundaria colapsada por defecto", () => {
    render(<TripInvoicingConsole trip={makeTrip()} />);

    const consoleEl = screen.getByTestId("trip-invoicing-console");
    expect(consoleEl).toHaveAttribute("data-density", "secondary");
    expect(consoleEl).toHaveAttribute("data-collapsed", "true");
    expect(
      screen.getByRole("button", { name: sectionCopy.expand }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("fiscal-section")).not.toBeInTheDocument();
  });

  it("in_progress sin ATF: expandir muestra el cuerpo fiscal", async () => {
    const user = userEvent.setup();
    render(<TripInvoicingConsole trip={makeTrip()} />);

    await user.click(screen.getByRole("button", { name: sectionCopy.expand }));
    expect(screen.getByTestId("fiscal-section")).toBeInTheDocument();
    expect(screen.getByTestId("trip-invoicing-console")).toHaveAttribute(
      "data-collapsed",
      "false",
    );
  });

  it("in_progress con ATF: consola expandida (job fiscal intacto)", () => {
    render(
      <TripInvoicingConsole
        trip={makeTrip({ requiresFiscalAttention: true })}
      />,
    );

    expect(screen.getByTestId("trip-invoicing-console")).toHaveAttribute(
      "data-density",
      "expanded",
    );
    expect(screen.getByTestId("fiscal-section")).toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-invoicing-console-toggle"),
    ).not.toBeInTheDocument();
  });
});
