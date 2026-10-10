import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { useTripFiscalSheets } from "./useTripFiscalSheets";

type StampOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown, invoiceId: string) => void;
};
type UpdateCallbacks = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const stampMock = vi.fn();
const updateMock = vi.fn();
let stampOptions: StampOptions = {};

vi.mock("@features/invoicing/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/invoicing/application")>();
  return {
    ...actual,
    useStampInvoice: (options: StampOptions) => {
      stampOptions = options;
      return { mutate: stampMock, isPending: false };
    },
    useUpdateInvoice: () => ({ mutate: updateMock, isPending: false }),
  };
});

vi.mock("@features/catalogs/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/catalogs/application")>();
  const names: Record<string, string> = {
    "616": "Sin obligaciones fiscales",
    S01: "Sin efectos fiscales",
  };
  const label = (code: string | null | undefined) =>
    code && names[code] ? `${code} · ${names[code]}` : (code ?? "");
  return {
    ...actual,
    useReceiverFiscalCatalogLabels: () => ({
      taxRegimeLabel: label,
      cfdiUsageLabel: label,
    }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({
      toast: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      promise: vi.fn(),
      dismiss: vi.fn(),
    }),
  };
});

type Receiver = {
  receiverRfc: string;
  receiverTaxRegime: string;
  cfdiUsage: string;
};

function Harness({ invoiceReceiver }: { invoiceReceiver?: Receiver | null }) {
  const fiscal = useTripFiscalSheets({ invoiceReceiver });
  return (
    <>
      <button type="button" onClick={() => void fiscal.requestStamp("inv-1")}>
        Timbrar
      </button>
      <span data-testid="busy">{String(fiscal.isStampBusy)}</span>
      {fiscal.sheets}
    </>
  );
}

function renderHarness(invoiceReceiver?: Receiver | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness invoiceReceiver={invoiceReceiver} />
    </QueryClientProvider>,
  );
}

const mismatchMessage =
  "Para el RFC XAXX010101000 el SAT solo acepta régimen 616 (Sin obligaciones fiscales) y uso S01 (Sin efectos fiscales). Esta factura tiene régimen 626 y uso G03.";

describe("useTripFiscalSheets — receptor con RFC genérico", () => {
  beforeEach(() => {
    stampMock.mockReset();
    updateMock.mockReset();
    stampOptions = {};
  });

  it("antes de timbrar muestra los cambios y «Ajustar y timbrar» guarda 616/S01 y timbra", async () => {
    updateMock.mockImplementation((_vars: unknown, callbacks: UpdateCallbacks) =>
      callbacks.onSuccess?.(),
    );
    const user = userEvent.setup();
    renderHarness({
      receiverRfc: "XAXX010101000",
      receiverTaxRegime: "626",
      cfdiUsage: "G03",
    });

    await user.click(screen.getByRole("button", { name: "Timbrar" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(
      "Antes de timbrar: ajustar datos de público en general",
    );
    expect(dialog).toHaveTextContent(
      "El SAT solo acepta estos valores para XAXX010101000:",
    );
    expect(dialog).toHaveTextContent(
      "Régimen: 626 → 616 · Sin obligaciones fiscales",
    );
    expect(dialog).toHaveTextContent("Uso: G03 → S01 · Sin efectos fiscales");
    expect(stampMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("busy")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Ajustar y timbrar" }));

    expect(updateMock).toHaveBeenCalledWith(
      {
        id: "inv-1",
        payload: { receiverTaxRegime: "616", cfdiUsage: "S01" },
      },
      expect.any(Object),
    );
    expect(stampMock).toHaveBeenCalledWith("inv-1");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("solo lista el campo que cambia", async () => {
    const user = userEvent.setup();
    renderHarness({
      receiverRfc: "XAXX010101000",
      receiverTaxRegime: "616",
      cfdiUsage: "G03",
    });

    await user.click(screen.getByRole("button", { name: "Timbrar" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Uso: G03 → S01 · Sin efectos fiscales");
    expect(dialog).not.toHaveTextContent("Régimen:");
  });

  it("Cancelar cierra sin guardar ni timbrar", async () => {
    const user = userEvent.setup();
    renderHarness({
      receiverRfc: "XAXX010101000",
      receiverTaxRegime: "626",
      cfdiUsage: "G03",
    });

    await user.click(screen.getByRole("button", { name: "Timbrar" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(updateMock).not.toHaveBeenCalled();
    expect(stampMock).not.toHaveBeenCalled();
  });

  it("si el ajuste falla, muestra el error en el Dialog y no timbra", async () => {
    updateMock.mockImplementation((_vars: unknown, callbacks: UpdateCallbacks) =>
      callbacks.onError?.(new ApiError("La factura ya no es borrador.", 409)),
    );
    const user = userEvent.setup();
    renderHarness({
      receiverRfc: "XAXX010101000",
      receiverTaxRegime: "626",
      cfdiUsage: "G03",
    });

    await user.click(screen.getByRole("button", { name: "Timbrar" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Ajustar y timbrar" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(
      "No se pudieron ajustar los datos de la factura",
    );
    expect(dialog).toHaveTextContent("La factura ya no es borrador.");
    expect(stampMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "RFC genérico ya correcto",
      { receiverRfc: "XAXX010101000", receiverTaxRegime: "616", cfdiUsage: "S01" },
    ],
    [
      "RFC normal",
      { receiverRfc: "CSA010101AB1", receiverTaxRegime: "626", cfdiUsage: "G03" },
    ],
  ])("%s: timbra directo sin Dialog", async (_label, receiver) => {
    const user = userEvent.setup();
    renderHarness(receiver);

    await user.click(screen.getByRole("button", { name: "Timbrar" }));

    await waitFor(() => expect(stampMock).toHaveBeenCalledWith("inv-1"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rechazo RECEIVER_GENERIC_RFC_FISCAL_MISMATCH abre el Dialog con el mensaje de la API y ofrece «Ajustar y timbrar»", async () => {
    updateMock.mockImplementation((_vars: unknown, callbacks: UpdateCallbacks) =>
      callbacks.onSuccess?.(),
    );
    const user = userEvent.setup();
    renderHarness(null);

    await user.click(screen.getByRole("button", { name: "Timbrar" }));
    await waitFor(() => expect(stampMock).toHaveBeenCalledTimes(1));

    act(() => {
      stampOptions.onError?.(
        new ApiError(mismatchMessage, 422, "RECEIVER_GENERIC_RFC_FISCAL_MISMATCH", {
          receiver_tax_regime: "626",
          cfdi_usage: "G03",
        }),
        "inv-1",
      );
    });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(
      "No se timbró: datos de público en general",
    );
    expect(dialog).toHaveTextContent(mismatchMessage);
    expect(dialog).not.toHaveTextContent("validación fiscal/XSD");

    await user.click(screen.getByRole("button", { name: "Ajustar y timbrar" }));

    expect(updateMock).toHaveBeenCalledWith(
      {
        id: "inv-1",
        payload: { receiverTaxRegime: "616", cfdiUsage: "S01" },
      },
      expect.any(Object),
    );
    expect(stampMock).toHaveBeenCalledTimes(2);
    expect(stampMock).toHaveBeenLastCalledWith("inv-1");
  });
});
