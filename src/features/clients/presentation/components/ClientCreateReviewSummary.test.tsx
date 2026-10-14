import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientCreateReviewSummary } from "./ClientCreateReviewSummary";
import type { ClientFormData } from "../validation/clientSchema";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";

const clientData: ClientFormData = {
  type: "company",
  legalName: "Acme SA de CV",
  tradeName: "Acme",
  cfdiReceptorProfile: "receptor_cfdi",
  taxId: "AAA010101AAA",
  taxRegime: "601",
  contactName: "Ana Pérez",
  contactPosition: "",
  phone: "5551234567",
  secondaryPhone: "",
  email: "ana@acme.mx",
  billingEmail: "",
  paymentTerms: "cash",
  creditDays: 0,
  creditLimit: undefined,
  notes: "",
  invoiceAutoDispatchEnabled: false,
};

const addressData = {
  addressType: "billing",
  locationName: "Matriz",
  isPrimary: true,
  street: "Av Reforma",
  exteriorNumber: "100",
  interiorNumber: "",
  neighborhoodName: "Centro",
  postalCode: "06000",
  satCountryCode: "MEX",
  satStateCode: "DIF",
  satMunicipalityCode: "002",
  satLocalityCode: "",
  satNeighborhoodCode: "",
  reference: "",
} as ClientAddressFormData;

describe("ClientCreateReviewSummary (F3 D14)", () => {
  it("usa sentence case en eyebrows (sin ALL-CAPS / tracking-wide)", () => {
    const { container } = render(
      <ClientCreateReviewSummary
        clientData={clientData}
        addressData={addressData}
      />,
    );

    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Dirección fiscal")).toBeInTheDocument();

    const eyebrowNodes = container.querySelectorAll(
      "p.text-xs.font-medium.text-muted-foreground",
    );
    expect(eyebrowNodes.length).toBeGreaterThanOrEqual(2);
    for (const node of eyebrowNodes) {
      expect(node.className).not.toMatch(/\buppercase\b/);
      expect(node.className).not.toMatch(/\btracking-wide\b/);
    }
  });

  it("muestra el resumen del cliente y la dirección", () => {
    render(
      <ClientCreateReviewSummary
        clientData={clientData}
        addressData={addressData}
      />,
    );

    expect(screen.getByText("Acme SA de CV")).toBeInTheDocument();
    expect(screen.getByText("Datos fiscales y comerciales")).toBeInTheDocument();
    expect(screen.getByText("Matriz")).toBeInTheDocument();
  });
});
