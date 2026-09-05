import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";

import { ClientAddressForm } from "./ClientAddressForm";
import { clientDetailCopy } from "../copy/clientDetailCopy";

vi.mock("@shared/ui/address-input", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/address-input")>();
  return {
    ...actual,
    AddressInput: () => <div data-testid="address-input-stub" />,
  };
});

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: ({
      label,
      context,
      existingAddresses,
      includeInternal,
    }: {
      label?: string;
      context: string;
      existingAddresses?: unknown;
      includeInternal?: boolean;
    }) => (
      <div
        data-testid="location-field-stub"
        data-context={context}
        data-has-existing={existingAddresses ? "1" : "0"}
        data-include-internal={includeInternal === false ? "0" : "1"}
      >
        {label}
      </div>
    ),
  };
});

vi.mock("../../application/hooks/useClientAddresses", () => ({
  useClientAddresses: (clientId: string | undefined) => ({
    data: clientId
      ? [
          {
            id: "addr-sibling",
            addressType: "shipping",
            isPrimary: false,
            isActive: true,
            postalCode: "44100",
            address: "Calle Hermana 1",
            latitude: 20.67,
            longitude: -103.35,
          },
        ]
      : [],
    isLoading: false,
  }),
}));

function renderForm(props: Partial<ComponentProps<typeof ClientAddressForm>> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ClientAddressForm formContext="billingOnCreate" {...props} />
    </QueryClientProvider>,
  );
}

describe("ClientAddressForm LocationField (ADR-0092 F4)", () => {
  it("renders LocationField with fiscal context on billing create", () => {
    renderForm({ formContext: "billingOnCreate" });
    const field = screen.getByTestId("location-field-stub");
    expect(field).toHaveAttribute("data-context", "fiscal");
    expect(field).toHaveTextContent(
      clientDetailCopy.address.locationSearchLabel,
    );
  });

  it("disables catalog search on create-only address forms", () => {
    renderForm({ formContext: "billingOnCreate" });
    expect(screen.getByTestId("location-field-stub")).toHaveAttribute(
      "data-include-internal",
      "0",
    );
  });

  it("renders LocationField with operational context for additional addresses", () => {
    renderForm({ formContext: "additional", clientId: "client-1" });
    expect(screen.getByTestId("location-field-stub")).toHaveAttribute(
      "data-context",
      "operational",
    );
  });

  it("passes existingAddresses when client has sibling addresses", () => {
    renderForm({ formContext: "additional", clientId: "client-1" });
    expect(screen.getByTestId("location-field-stub")).toHaveAttribute(
      "data-has-existing",
      "1",
    );
  });

  it("shows contact and notes fields for additional context only", () => {
    const { unmount } = renderForm({ formContext: "additional" });
    expect(
      screen.getByText(clientDetailCopy.address.contactSectionTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(clientDetailCopy.address.notesSectionTitle),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(clientDetailCopy.address.contactName)).toBeInTheDocument();
    expect(screen.getByLabelText(clientDetailCopy.address.notes)).toBeInTheDocument();
    unmount();

    renderForm({ formContext: "billingOnCreate" });
    expect(
      screen.queryByText(clientDetailCopy.address.contactSectionTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(clientDetailCopy.address.notesSectionTitle),
    ).not.toBeInTheDocument();
  });
});
