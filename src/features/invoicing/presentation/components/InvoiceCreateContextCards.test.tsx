/**
 * T5-036 / #37 — attach_carta_porte en split_share es solo lectura (fuente = reparto).
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { InvoiceCreateContextCards } from "./InvoiceCreateContextCards";
import { invoicingCopy } from "../copy/invoicingCopy";

const splitShareCopy = invoicingCopy.splitShare;

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
