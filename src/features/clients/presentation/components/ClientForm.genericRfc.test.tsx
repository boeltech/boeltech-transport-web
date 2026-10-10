import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClientForm } from "./ClientForm";

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
    disabled,
  }: {
    triggerId?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) => (
    <input
      id={triggerId}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="tax-regime-select"
    />
  ),
}));

vi.mock("@features/catalogs/application", () => ({
  useReceiverFiscalCatalogLabels: () => ({
    taxRegimeLabel: (code: string | null | undefined) =>
      code === "616" ? "616 · Sin obligaciones fiscales" : (code ?? ""),
    cfdiUsageLabel: (code: string | null | undefined) => code ?? "",
  }),
}));

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const taxIdInput = () => document.getElementById("taxId") as HTMLInputElement;
const legalNameInput = () =>
  document.getElementById("legalName") as HTMLInputElement;
const taxRegimeInput = () => screen.getByTestId("tax-regime-select");
const typeTrigger = () => document.getElementById("type") as HTMLElement;

describe("ClientForm — RFC genérico", () => {
  it("al escribir XAXX010101000 fija tipo, régimen 616 y razón social, y avisa del cambio de régimen", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <ClientForm
        mode="create"
        onChange={vi.fn()}
        defaultValues={{ type: "company", taxRegime: "626" }}
      />,
    );

    await user.type(taxIdInput(), "XAXX010101000");

    await waitFor(() => expect(taxRegimeInput()).toHaveValue("616"));
    expect(taxRegimeInput()).toBeDisabled();
    expect(typeTrigger()).toBeDisabled();
    expect(typeTrigger()).toHaveTextContent(/Persona F[ií]sica/i);
    expect(legalNameInput()).toHaveValue("PUBLICO EN GENERAL");
    expect(
      screen.getByText("Cambiamos el régimen de 626 a 616."),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Fijado por el SAT para público en general."),
    ).toHaveLength(2);
  });

  it("no sobrescribe una razón social ya capturada", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <ClientForm
        mode="create"
        onChange={vi.fn()}
        defaultValues={{ legalName: "Mostrador Norte" }}
      />,
    );

    await user.type(taxIdInput(), "XAXX010101000");

    await waitFor(() => expect(taxRegimeInput()).toHaveValue("616"));
    expect(legalNameInput()).toHaveValue("Mostrador Norte");
  });

  it("al cambiar a un RFC normal vacía el régimen, lo habilita y pide elegirlo", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <ClientForm mode="create" onChange={vi.fn()} defaultValues={{}} />,
    );

    await user.type(taxIdInput(), "XAXX010101000");
    await waitFor(() => expect(taxRegimeInput()).toHaveValue("616"));

    await user.clear(taxIdInput());
    await user.type(taxIdInput(), "CSA010101AB1");

    await waitFor(() => expect(taxRegimeInput()).toHaveValue(""));
    expect(taxRegimeInput()).not.toBeDisabled();
    expect(legalNameInput()).toHaveValue("");
    expect(
      screen.getByText(
        "Ya no es público en general: elige el régimen del RFC nuevo.",
      ),
    ).toBeInTheDocument();
  });

  it("en edición carga el régimen ya corregido y lo explica", async () => {
    renderWithQuery(
      <ClientForm
        mode="edit"
        onChange={vi.fn()}
        defaultValues={{
          type: "individual",
          legalName: "PUBLICO EN GENERAL",
          taxId: "XAXX010101000",
          taxRegime: "626",
        }}
      />,
    );

    await waitFor(() => expect(taxRegimeInput()).toHaveValue("616"));
    expect(
      screen.getByText("Corregimos el régimen de este cliente"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tenía 626; para público en general debe ser 616 · Sin obligaciones fiscales. Guarda para aplicar el cambio.",
      ),
    ).toBeInTheDocument();
  });

  it("XEXX010101000 también fija el régimen 616 sin autocompletar la razón social", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <ClientForm mode="create" onChange={vi.fn()} defaultValues={{}} />,
    );

    await user.type(taxIdInput(), "XEXX010101000");

    await waitFor(() => expect(taxRegimeInput()).toHaveValue("616"));
    expect(legalNameInput()).toHaveValue("");
    expect(
      screen.getAllByText("Fijado por el SAT para residentes en el extranjero."),
    ).toHaveLength(2);
  });

  it("RFC normal no cambia el comportamiento", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <ClientForm
        mode="create"
        onChange={vi.fn()}
        defaultValues={{ type: "company", taxRegime: "601" }}
      />,
    );

    await user.type(taxIdInput(), "CSA010101AB1");

    expect(taxRegimeInput()).toHaveValue("601");
    expect(taxRegimeInput()).not.toBeDisabled();
    expect(typeTrigger()).not.toBeDisabled();
    expect(
      screen.queryByText(/Fijado por el SAT/),
    ).not.toBeInTheDocument();
  });
});
