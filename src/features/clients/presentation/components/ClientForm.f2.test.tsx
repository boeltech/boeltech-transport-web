import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientForm } from "./ClientForm";
import { CLIENT_EDIT_SECTION_IDS } from "./clientEditSections";
import { clientsCopy } from "../copy/clientsCopy";
import type { Client } from "../../domain";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("@features/catalogs", () => ({
  RegimenFiscalSelect: ({
    triggerId,
    value,
    onValueChange,
  }: {
    triggerId?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <input
      id={triggerId}
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="tax-regime-select"
    />
  ),
}));

vi.mock("@features/catalogs/application", () => ({
  useReceiverFiscalCatalogLabels: () => ({
    taxRegimeLabel: (code: string | null | undefined) => code ?? "",
    cfdiUsageLabel: (code: string | null | undefined) => code ?? "",
  }),
}));

const editClient = {
  id: "c-edit",
  tenantId: "t1",
  clientCode: "CLI-1",
  type: "company",
  legalName: "Transportes Demo SA de CV",
  tradeName: "Demo",
  cfdiReceptorProfile: "receptor_cfdi",
  taxId: "AAA010101AAA",
  taxRegime: "601",
  paymentTerms: "cash",
  creditDays: 0,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as Client;

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const fc = clientsCopy.form;

describe("ClientForm edit F2 (D8)", () => {
  it("monta rail con secciones reales, pie sticky y Guardar disabled sin dirty", () => {
    const { container } = renderWithQuery(
      <ClientForm
        mode="edit"
        client={editClient}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: fc.edit.sidebar.title }),
    ).toBeInTheDocument();

    for (const label of [
      fc.section.type.nav,
      fc.section.fiscal.nav,
      fc.section.dispatch.nav,
      fc.section.commercial.nav,
      fc.section.notes.nav,
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }

    expect(document.getElementById(CLIENT_EDIT_SECTION_IDS.type)).toBeTruthy();
    expect(document.getElementById(CLIENT_EDIT_SECTION_IDS.fiscal)).toBeTruthy();
    expect(
      document.getElementById(CLIENT_EDIT_SECTION_IDS.dispatch),
    ).toBeTruthy();
    expect(
      document.getElementById(CLIENT_EDIT_SECTION_IDS.commercial),
    ).toBeTruthy();
    expect(document.getElementById(CLIENT_EDIT_SECTION_IDS.notes)).toBeTruthy();

    expect(container.querySelector(".sticky.bottom-0")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: fc.action.save }),
    ).toBeDisabled();
  });

  it("omite Envío del rail cuando el perfil es Solo comercial", () => {
    renderWithQuery(
      <ClientForm
        mode="edit"
        client={
          {
            ...editClient,
            cfdiReceptorProfile: "comercial_only",
            taxId: null,
            taxRegime: null,
          } as Client
        }
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: new RegExp(fc.section.type.nav, "i") }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(fc.section.dispatch.nav, "i"),
      }),
    ).toBeNull();
    expect(
      document.getElementById(CLIENT_EDIT_SECTION_IDS.dispatch),
    ).toBeNull();
  });

  it("clic en rail hace scroll a la sección", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderWithQuery(
      <ClientForm
        mode="edit"
        client={editClient}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(fc.section.notes.nav, "i"),
      }),
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});
