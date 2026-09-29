import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { formatDate } from "@shared/utils/dateUtils";
import { FINANCE_DISPATCH_DETAIL_PATH } from "../../application/financeRoutes";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchCreateRunDialog } from "./FinanceDispatchCreateRunDialog";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const mutateAsync = vi.fn();
const refetchPreview = vi.fn();

const previewData = {
  billingSchemeId: "scheme-weekly",
  cadenceKind: "periodic_weekly" as const,
  windowKind: "calendar_cut" as const,
  timezone: "America/Mexico_City",
  periodStart: "2026-04-18T06:00:00.000Z",
  periodEnd: "2026-04-25T06:00:00.000Z",
  inclusiveStart: "2026-04-18",
  inclusiveEnd: "2026-04-24",
  cutDate: "2026-04-25",
  windowHours: null,
};

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({
    data: [
      {
        id: "scheme-weekly",
        name: "Corte semanal viernes",
        cadenceKind: "periodic_weekly",
        params: { weekdays: [5] },
        isDefault: true,
        isActive: true,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("@features/finance/application", () => ({
  useBillingDispatchPeriodPreview: () => ({
    data: previewData,
    isLoading: false,
    isError: false,
    refetch: refetchPreview,
  }),
  useCreateBillingDispatchRun: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

function renderDialog(
  alreadyOpenSource: "list" | "workbench" = "workbench",
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FinanceDispatchCreateRunDialog
          open
          onOpenChange={vi.fn()}
          alreadyOpenSource={alreadyOpenSource}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FinanceDispatchCreateRunDialog", () => {
  beforeEach(() => {
    mutateAsync.mockReset().mockResolvedValue({
      run: { id: "run-1" },
      reused: false,
    });
    refetchPreview.mockReset();
    navigateMock.mockReset();
  });

  it("muestra el preview del último corte cerrado antes de Armar", async () => {
    renderDialog();
    const copy = dispatchRunsCopy.tab.createDialog;

    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.schemeHint)).toBeInTheDocument();
    expect(screen.getByText(copy.previewTitle)).toBeInTheDocument();
    expect(
      screen.getByText(
        dispatchRunsCopy.detail.periodCalendar(
          formatDate("2026-04-18"),
          formatDate("2026-04-24"),
          formatDate("2026-04-25"),
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.submit }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.cancel }),
    ).toBeInTheDocument();
  });

  it("al armar un lote nuevo no manda reference_at y abre el detalle", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.createDialog.submit,
      }),
    );

    expect(mutateAsync).toHaveBeenCalledWith({
      billingSchemeId: "scheme-weekly",
      autoPreview: true,
    });
    expect(mutateAsync.mock.calls[0]?.[0]).not.toHaveProperty("referenceAt");
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        FINANCE_DISPATCH_DETAIL_PATH("run-1"),
        { replace: true, state: { from: "/finance/dispatch" } },
      );
    });
  });

  it("si el corte ya tiene lote abierto avisa y no navega al detalle", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({
      run: { id: "run-existing" },
      reused: true,
    });
    const alreadyOpen = dispatchRunsCopy.tab.createDialog.alreadyOpen;
    renderDialog("list");

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.createDialog.submit,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: alreadyOpen.title }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(alreadyOpen.bodyOnList)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: alreadyOpen.dismiss }),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("desde el workbench indica entrar a Por periodo", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({
      run: { id: "run-existing" },
      reused: true,
    });
    const alreadyOpen = dispatchRunsCopy.tab.createDialog.alreadyOpen;
    renderDialog("workbench");

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.createDialog.submit,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(alreadyOpen.bodyFromWorkbench)).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
