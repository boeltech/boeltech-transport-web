import { createRef, type ComponentProps, type Ref } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ClientAddressForm, type ClientAddressFormRef } from "./ClientAddressForm";
import { CLIENT_ADDRESS_FISCAL_COPY } from "../config/clientConfig";

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
    LocationField: () => <div data-testid="location-field-stub" />,
  };
});

vi.mock("../../application/hooks/useClientAddresses", () => ({
  useClientAddresses: () => ({ data: [], isLoading: false }),
}));

const SAT_NOTICE = CLIENT_ADDRESS_FISCAL_COPY.rfcSatRegistered;
const NOT_CLIENT_NOTICE =
  "No es el RFC del cliente de la factura ni el de tu empresa, salvo que sea la misma persona.";

function renderForm(
  props: Partial<ComponentProps<typeof ClientAddressForm>> = {},
  ref?: Ref<ClientAddressFormRef>,
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ClientAddressForm ref={ref} formContext="additional" {...props} />
    </QueryClientProvider>,
  );
}

describe("ClientAddressForm RFC de la ubicación", () => {
  it("muestra la frase de inscripción bajo el RFC y el placeholder nuevo del nombre", () => {
    renderForm();
    expect(screen.getByText(SAT_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_ADDRESS_FISCAL_COPY.hint)).toBeInTheDocument();
    expect(screen.queryByText(NOT_CLIENT_NOTICE)).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ej. Logística del Centro SA de CV"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(SAT_NOTICE)).toHaveLength(1);
  });

  it("muestra la misma frase en bodega y recolección", () => {
    const { unmount } = renderForm({
      defaultValues: { addressType: "warehouse" },
    });
    expect(screen.getByText(SAT_NOTICE)).toBeInTheDocument();
    unmount();

    renderForm({ defaultValues: { addressType: "pickup" } });
    expect(screen.getByText(SAT_NOTICE)).toBeInTheDocument();
  });

  it("no muestra la frase en otra ubicación ni en el domicilio fiscal del alta", () => {
    const { unmount } = renderForm({
      defaultValues: { addressType: "other" },
    });
    expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
    expect(
      screen.queryByText(CLIENT_ADDRESS_FISCAL_COPY.sectionTitle),
    ).not.toBeInTheDocument();
    unmount();

    renderForm({ formContext: "billingOnCreate" });
    expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
  });

  it("oculta la frase si el RFC, recortado y en mayúsculas, es genérico", async () => {
    const user = userEvent.setup();
    const { unmount } = renderForm();
    expect(screen.getByText(SAT_NOTICE)).toBeInTheDocument();

    const rfc = screen.getByLabelText(CLIENT_ADDRESS_FISCAL_COPY.rfcLabel);
    await user.type(rfc, "xaxx010101000");
    await waitFor(() => {
      expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/queda resuelto/i)).not.toBeInTheDocument();
    unmount();

    renderForm({
      defaultValues: { rfcRemitenteDestinatario: "  xexx010101000  " },
    });
    expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByText(/queda resuelto/i)).not.toBeInTheDocument();
  });

  it("sigue mostrando la frase con otro RFC y la oculta mientras el campo tiene error", async () => {
    const user = userEvent.setup();
    const ref = createRef<ClientAddressFormRef>();
    renderForm({}, ref);

    const rfc = screen.getByLabelText(CLIENT_ADDRESS_FISCAL_COPY.rfcLabel);
    await user.type(rfc, "EKU9003173C9");
    expect(screen.getByText(SAT_NOTICE)).toBeInTheDocument();

    act(() => {
      ref.current?.applySatFieldErrors({
        rfcRemitenteDestinatario: "RFC inválido",
      });
    });
    await waitFor(() => {
      expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
    });
    expect(document.getElementById("rfcRemitenteDestinatario-error")).toHaveTextContent(
      "RFC inválido",
    );
    expect(screen.getByText(CLIENT_ADDRESS_FISCAL_COPY.hint)).toBeInTheDocument();
  });
});
