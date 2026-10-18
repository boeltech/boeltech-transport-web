/**
 * T5-036 / #37 — attach_carta_porte en split_share es solo lectura (fuente = reparto).
 * Opción S — link al viaje pasa state.from (nunca /invoices/new).
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import type { InvoicePrefill } from "@features/invoicing/domain";
import { InvoiceCreateContextCards } from "./InvoiceCreateContextCards";
import { invoicingCopy } from "../copy/invoicingCopy";

const splitShareCopy = invoicingCopy.splitShare;

const createPrefill = {
  tripId: "trip-1",
  tripCode: "TRP-001",
  receiverName: "Cliente A SA",
  receiverRfc: "AAA010101AAA",
  issuerName: "Emisor SA",
  issuerRfc: "EME010101XXX",
  issuerTaxRegime: "601",
  issueLocation: "64000",
  receiverTaxRegime: "601",
  receiverPostalCode: "64000",
  cfdiUsage: "G03",
  serie: "A",
  paymentForm: "03",
  paymentMethod: "PUE",
  currency: "MXN",
  subtotal: 6000,
  taxRate: 0.16,
  totalTax: 960,
  retainedTax: 0,
  retainedTaxRate: 0,
  total: 6960,
  clientType: "moral",
  suggestedConcepts: [],
} satisfies InvoicePrefill;

function TripLocationProbe() {
  const location = useLocation();
  return (
    <pre data-testid="trip-location-state">
      {JSON.stringify(location.state ?? null)}
    </pre>
  );
}

function renderSplitShareCp(opts: {
  attachCartaPorte: boolean;
  cartaPorteAlreadyAttached?: boolean;
}) {
  return render(
    <MemoryRouter>
      <InvoiceCreateContextCards
        mode="create"
        receiverName="Cliente A SA"
        receiverRfc="AAA010101AAA"
        total={6960}
        sharePercent={60}
        splitLegsInvoiced={0}
        splitLegsTotal={2}
        attachCartaPorte={opts.attachCartaPorte}
        showCartaPorte
        cartaPorteAlreadyAttached={opts.cartaPorteAlreadyAttached ?? false}
      />
    </MemoryRouter>,
  );
}

describe("InvoiceCreateContextCards — Opción S wayfinding al viaje", () => {
  it("link del código de viaje pasa state.from a Por facturar", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/invoices/new"]}>
        <Routes>
          <Route
            path="/invoices/new"
            element={
              <InvoiceCreateContextCards
                mode="create"
                prefill={createPrefill}
                receiverName={createPrefill.receiverName}
                receiverRfc={createPrefill.receiverRfc}
                total={6960}
                tripReturnFrom="/finance/invoiceable?bucket=ready"
              />
            }
          />
          <Route path="/trips/:id" element={<TripLocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /TRP-001/i }));
    expect(screen.getByTestId("trip-location-state")).toHaveTextContent(
      JSON.stringify({ from: "/finance/invoiceable?bucket=ready" }),
    );
  });
});

describe("InvoiceCreateContextCards — split_share Carta Porte RO", () => {
  it("muestra checkbox visible, disabled y checked con hint del reparto", () => {
    renderSplitShareCp({ attachCartaPorte: true });

    const checkbox = screen.getByRole("checkbox", {
      name: new RegExp(splitShareCopy.attachCartaPorteLabel, "i"),
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
    expect(
      screen.getByText(splitShareCopy.attachCartaPorteHint),
    ).toBeInTheDocument();
  });

  it("leg no portador: visible, disabled, unchecked; click no muta", async () => {
    const user = userEvent.setup();
    renderSplitShareCp({ attachCartaPorte: false });

    const checkbox = screen.getByRole("checkbox", {
      name: new RegExp(splitShareCopy.attachCartaPorteLabel, "i"),
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeDisabled();
  });

  it("con CP ya adjunta: disabled, unchecked y hint de ya adjunta", () => {
    renderSplitShareCp({
      attachCartaPorte: false,
      cartaPorteAlreadyAttached: true,
    });

    const checkbox = screen.getByRole("checkbox", {
      name: new RegExp(splitShareCopy.attachCartaPorteLabel, "i"),
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
    expect(
      screen.getByText(splitShareCopy.attachCartaPorteDisabledHint),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(splitShareCopy.attachCartaPorteHint),
    ).not.toBeInTheDocument();
  });
});
