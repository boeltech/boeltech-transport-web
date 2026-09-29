/**
 * Layout asimétrico del tab Datos (D1–D7): izq apilada, der comercial, sin stretch.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Client } from "../../domain";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import { ClientDetailDataTab } from "./ClientDetailDataTab";

const idCopy = clientDetailCopy.identification;
const dispatchCopy = clientDetailCopy.invoiceDispatch;
const contactCopy = clientDetailCopy.primaryContact;
const notesCopy = clientDetailCopy.notes;

const baseClient = {
  id: "c1",
  tenantId: "t1",
  clientCode: "CLI-1",
  type: "company",
  legalName: "Transportes Demo SA de CV",
  tradeName: "Demo",
  taxId: "AAA010101AAA",
  taxRegime: "601",
  paymentTerms: "cash",
  creditDays: 0,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as Client;

describe("ClientDetailDataTab layout", () => {
  it("con comercial: ID+Contacto en subgrid, Envío y Notas en columna izq, comercial a la der", () => {
    const { container } = render(
      <ClientDetailDataTab
        client={baseClient}
        taxRegimeLabel="General de Ley"
        billingSchemeLabel="Corte semanal"
        commercialSection={<div data-testid="commercial-slot">Comercial</div>}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("items-start");
    expect(root.className).toContain("lg:grid-cols-[2fr_1fr]");

    const leftCol = root.firstElementChild as HTMLElement;
    const titles = [
      idCopy.title,
      contactCopy.title,
      dispatchCopy.title,
      notesCopy.title,
    ];
    const text = leftCol.textContent ?? "";
    let lastIdx = -1;
    for (const title of titles) {
      const idx = text.indexOf(title);
      expect(idx, `expected "${title}" in left column`).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }

    expect(screen.getByTestId("commercial-slot")).toBeInTheDocument();
    expect(root.lastElementChild).toContainElement(screen.getByTestId("commercial-slot"));

    const idContactSubgrid = leftCol.firstElementChild as HTMLElement;
    expect(idContactSubgrid.className).toContain("items-stretch");
    expect(idContactSubgrid.className).toContain("sm:grid-cols-2");
    for (const card of Array.from(idContactSubgrid.children)) {
      expect(card.className).toMatch(/\bh-full\b/);
      expect(card.className).toMatch(/\bflex\b/);
    }
    // Solo se igualan entre sí; la columna izq no se estira contra comercial.
    expect(root.className).toContain("items-start");
  });

  it("sin comercial: ID+Contacto en 2 cols y Envío/Notas debajo (paridad D6)", () => {
    const { container } = render(
      <ClientDetailDataTab client={baseClient} taxRegimeLabel={null} />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain("lg:grid-cols-[2fr_1fr]");
    expect(screen.queryByTestId("commercial-slot")).not.toBeInTheDocument();
    expect(screen.getByText(dispatchCopy.title)).toBeInTheDocument();
    expect(screen.getByText(notesCopy.title)).toBeInTheDocument();
  });

  it("comercial_only: oculta Envío y no rompe layout", () => {
    render(
      <ClientDetailDataTab
        client={{ ...baseClient, cfdiReceptorProfile: "comercial_only" }}
        taxRegimeLabel={null}
        commercialSection={<div data-testid="commercial-slot">Comercial</div>}
      />,
    );

    expect(screen.queryByText(dispatchCopy.title)).not.toBeInTheDocument();
    expect(screen.getByText(idCopy.title)).toBeInTheDocument();
    expect(screen.getByText(contactCopy.title)).toBeInTheDocument();
    expect(screen.getByText(notesCopy.title)).toBeInTheDocument();
    expect(screen.getByTestId("commercial-slot")).toBeInTheDocument();
  });

  it("CTA Ir a Contactos dispara onGoToContacts (empty)", async () => {
    const user = userEvent.setup();
    const onGoToContacts = vi.fn();

    render(
      <ClientDetailDataTab
        client={baseClient}
        taxRegimeLabel={null}
        onGoToContacts={onGoToContacts}
      />,
    );

    await user.click(screen.getByRole("button", { name: contactCopy.cta }));
    expect(onGoToContacts).toHaveBeenCalledOnce();
  });

  it("CTA Ver en Contactos dispara onGoToContacts (con principal)", async () => {
    const user = userEvent.setup();
    const onGoToContacts = vi.fn();

    render(
      <ClientDetailDataTab
        client={{
          ...baseClient,
          primaryContact: {
            id: "pc1",
            tenantId: "t1",
            clientId: "c1",
            fullName: "Ana Pérez",
            signsCartaPorte: false,
            receivesInvoices: true,
            authorizesPayments: false,
            isPrimary: true,
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        }}
        taxRegimeLabel={null}
        onGoToContacts={onGoToContacts}
      />,
    );

    await user.click(screen.getByRole("button", { name: contactCopy.viewInContacts }));
    expect(onGoToContacts).toHaveBeenCalledOnce();
  });
});
