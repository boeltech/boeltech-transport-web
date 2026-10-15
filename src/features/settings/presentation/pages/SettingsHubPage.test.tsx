import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SettingsHubPage } from "./SettingsHubPage";
import { settingsHubCopy } from "../copy/settingsHubCopy";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("../../application/hooks", () => ({
  useCompanySettings: () => ({
    data: {
      legalName: "Demo",
      rfc: "TDE010101AAA",
      regimenFiscal: "601",
      fiscalAddress: { postalCode: "06600" },
    },
  }),
  useBillingSettings: () => ({
    data: {
      certificateConfigured: true,
      certificateExpiry: "2099-01-01T00:00:00.000Z",
      serieFactura: "A",
      folioInicial: 1,
    },
  }),
}));

describe("SettingsHubPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hub title, four job groups and readiness chips", () => {
    render(
      <MemoryRouter>
        <SettingsHubPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: settingsHubCopy.page.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: settingsHubCopy.groups.empresa.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: settingsHubCopy.groups.facturacion.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: settingsHubCopy.groups.padron.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: settingsHubCopy.groups.gobernanza.title,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "General", level: 3 }),
    ).toBeInTheDocument();
    const openLinks = screen.getAllByRole("link", {
      name: settingsHubCopy.openSection,
    });
    expect(
      openLinks.some((link) => link.getAttribute("href") === "/settings/general"),
    ).toBe(true);
    expect(screen.getByTestId("hub-readiness-strip")).toBeInTheDocument();
  });
});
