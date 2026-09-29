import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DispatchRunActions } from "./DispatchRunActions";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const mockHasPermission = vi.fn();
const mutateAsync = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("../../application/hooks/useBillingDispatchRuns", () => ({
  useCancelBillingDispatchRun: () => ({
    mutateAsync,
    isPending: false,
  }),
}));

function renderActions(
  props: Partial<ComponentProps<typeof DispatchRunActions>> = {},
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DispatchRunActions
          runId="run-1"
          status="previewed"
          periodLabel="18 abr — corte 25 abr"
          onView={vi.fn()}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DispatchRunActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && (action === "execute" || action === "read"),
    );
    mutateAsync.mockResolvedValue({ id: "run-1", status: "cancelled" });
  });

  it("dropdown ofrece Abrir y Cancelar envío, sin Editar", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    renderActions({ onView });

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.actions.menuAria("18 abr — corte 25 abr"),
      }),
    );

    expect(
      screen.getByRole("menuitem", { name: dispatchRunsCopy.tab.actions.open }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", {
        name: dispatchRunsCopy.tab.actions.cancel,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /editar/i })).not.toBeInTheDocument();
  });

  it("cancelar pide confirmación y no muta hasta confirmar", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.actions.menuAria("18 abr — corte 25 abr"),
      }),
    );
    await user.click(
      screen.getByRole("menuitem", {
        name: dispatchRunsCopy.tab.actions.cancel,
      }),
    );

    expect(
      screen.getByRole("alertdialog", {
        name: dispatchRunsCopy.tab.cancelDialog.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.tab.cancelDialog.body),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.tab.cancelDialog.confirm,
      }),
    );
    expect(mutateAsync).toHaveBeenCalledWith("run-1");
  });

  it("buttons pone Enviar facturas como primaria y Reenviar en Más", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onResend = vi.fn();
    renderActions({
      variant: "buttons",
      readyCount: 2,
      selectedResendCount: 1,
      onConfirm,
      onResend,
      onRefresh: vi.fn(),
    });

    expect(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.sendCta,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: dispatchRunsCopy.detail.resendCta,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.moreActions,
      }),
    );
    await user.click(
      screen.getByRole("menuitem", {
        name: dispatchRunsCopy.detail.resendCta,
      }),
    );
    expect(onResend).toHaveBeenCalled();
  });
});
