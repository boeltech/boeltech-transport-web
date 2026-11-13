import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatDateTime } from "@shared/utils/dateUtils";
import type { FiscalPolicy } from "../../infrastructure/fiscalPolicyApi";
import {
  FiscalPolicySettingsPage,
  formatDisableWarnClientsLine,
  formatDisableWarnRequestsLine,
} from "./FiscalPolicySettingsPage";

const policyState = vi.hoisted(() => ({
  current: null as FiscalPolicy | null,
  refetch: vi.fn(),
  mutateAsync: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: policyState.toast }),
}));

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../../application", () => ({
  useFiscalPolicy: () => ({
    data: policyState.current,
    isLoading: false,
    isError: false,
    refetch: policyState.refetch,
  }),
  useUpdateFiscalPolicy: () => ({
    mutateAsync: policyState.mutateAsync,
    isPending: false,
  }),
}));

const UPDATED_AT = "2026-11-02T18:00:00.000Z";

function policy(overrides: Partial<FiscalPolicy> = {}): FiscalPolicy {
  return {
    tenantId: "t1",
    sinCfdiMode: "comercial_only_clients",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: UPDATED_AT,
    updatedBy: null,
    updatedByName: null,
    disableImpact: {
      comercialOnlyClients: 2,
      openExceptionRequests: 1,
    },
    ...overrides,
  };
}

describe("formatDisableWarn* (D22)", () => {
  it("pluraliza clientes", () => {
    expect(formatDisableWarnClientsLine(0)).toBe(
      "No hay clientes Sin factura activos.",
    );
    expect(formatDisableWarnClientsLine(1)).toContain("1 cliente Sin factura activo");
    expect(formatDisableWarnClientsLine(3)).toContain("3 clientes Sin factura activos");
  });

  it("pluraliza solicitudes", () => {
    expect(formatDisableWarnRequestsLine(0)).toBe(
      "No hay solicitudes de excepción abiertas.",
    );
    expect(formatDisableWarnRequestsLine(1)).toBe(
      "Se cancelará 1 solicitud de excepción abierta.",
    );
    expect(formatDisableWarnRequestsLine(4)).toBe(
      "Se cancelarán 4 solicitudes de excepción abiertas.",
    );
  });
});

describe("FiscalPolicySettingsPage último cambio", () => {
  beforeEach(() => {
    policyState.refetch.mockReset();
    policyState.mutateAsync.mockReset();
    policyState.toast.mockReset();
  });

  it("no muestra la línea si updatedBy es null", () => {
    policyState.current = policy();
    render(<FiscalPolicySettingsPage />);
    expect(screen.queryByText(/Último cambio/)).not.toBeInTheDocument();
  });

  it("muestra nombre y fecha cuando hay actor", () => {
    policyState.current = policy({
      updatedBy: "user-1",
      updatedByName: "Ana López",
    });
    render(<FiscalPolicySettingsPage />);
    expect(
      screen.getByText(
        `Último cambio: Ana López · ${formatDateTime(UPDATED_AT)}`,
      ),
    ).toBeInTheDocument();
  });

  it("muestra la fecha sin nombre si updatedByName es null", () => {
    policyState.current = policy({
      updatedBy: "user-1",
      updatedByName: null,
    });
    render(<FiscalPolicySettingsPage />);
    expect(
      screen.getByText(`Último cambio · ${formatDateTime(UPDATED_AT)}`),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Último cambio:/)).not.toBeInTheDocument();
  });
});

describe("FiscalPolicySettingsPage R4 Dialog warn → disabled", () => {
  beforeEach(() => {
    policyState.refetch.mockReset();
    policyState.mutateAsync.mockReset();
    policyState.toast.mockReset();
    policyState.mutateAsync.mockResolvedValue(undefined);
  });

  it("no abre Dialog al solo elegir el radio No permitido (D19)", async () => {
    const user = userEvent.setup();
    policyState.current = policy();
    render(<FiscalPolicySettingsPage />);

    await user.click(screen.getByLabelText(/No permitido/i));

    expect(
      screen.queryByRole("alertdialog"),
    ).not.toBeInTheDocument();
    expect(policyState.refetch).not.toHaveBeenCalled();
    expect(policyState.mutateAsync).not.toHaveBeenCalled();
  });

  it("abre AlertDialog al Guardar hacia disabled tras preview (D19/D25)", async () => {
    const user = userEvent.setup();
    const fresh = policy({
      disableImpact: {
        comercialOnlyClients: 5,
        openExceptionRequests: 2,
      },
    });
    policyState.current = policy();
    policyState.refetch.mockResolvedValue({
      data: fresh,
      isError: false,
      error: null,
    });

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/No permitido/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    expect(policyState.refetch).toHaveBeenCalledTimes(1);
    expect(policyState.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByText(/¿Pasar a «No permitido»\?/)).toBeInTheDocument();
    expect(
      screen.getByText(/Hay 5 clientes Sin factura activos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Se cancelarán 2 solicitudes de excepción abiertas/),
    ).toBeInTheDocument();
  });

  it("muestra variante sin impacto cuando N=0 y M=0 (D23)", async () => {
    const user = userEvent.setup();
    const fresh = policy({
      disableImpact: {
        comercialOnlyClients: 0,
        openExceptionRequests: 0,
      },
    });
    policyState.current = policy();
    policyState.refetch.mockResolvedValue({
      data: fresh,
      isError: false,
      error: null,
    });

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/No permitido/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/No hay impacto sobre clientes ni solicitudes actuales/),
    ).toBeInTheDocument();
    expect(policyState.mutateAsync).not.toHaveBeenCalled();
  });

  it("Cancelar cierra Dialog sin PUT y deja draft dirty (D24)", async () => {
    const user = userEvent.setup();
    policyState.current = policy();
    policyState.refetch.mockResolvedValue({
      data: policy(),
      isError: false,
      error: null,
    });

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/No permitido/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(policyState.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/No permitido/i)).toBeChecked();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("Pasar a No permitido hace PUT y limpia draft (D24/D27)", async () => {
    const user = userEvent.setup();
    policyState.current = policy();
    policyState.refetch.mockResolvedValue({
      data: policy(),
      isError: false,
      error: null,
    });
    policyState.mutateAsync.mockResolvedValue(
      policy({ sinCfdiMode: "disabled" }),
    );

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/No permitido/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
    await user.click(
      screen.getByRole("button", { name: "Pasar a No permitido" }),
    );

    await waitFor(() => {
      expect(policyState.mutateAsync).toHaveBeenCalledWith("disabled");
    });
    expect(policyState.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Política fiscal actualizada" }),
    );
  });

  it("otras transiciones hacen PUT directo sin Dialog (D26)", async () => {
    const user = userEvent.setup();
    policyState.current = policy({ sinCfdiMode: "comercial_only_clients" });
    policyState.mutateAsync.mockResolvedValue(
      policy({ sinCfdiMode: "allowed_with_override" }),
    );

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/Permitido, con motivo/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(policyState.mutateAsync).toHaveBeenCalledWith(
        "allowed_with_override",
      );
    });
    expect(policyState.refetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("salir de disabled hace PUT sin Dialog (D26)", async () => {
    const user = userEvent.setup();
    policyState.current = policy({ sinCfdiMode: "disabled" });
    policyState.mutateAsync.mockResolvedValue(
      policy({ sinCfdiMode: "comercial_only_clients" }),
    );

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/Solo clientes Sin factura/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(policyState.mutateAsync).toHaveBeenCalledWith(
        "comercial_only_clients",
      );
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("si el preview falla, no hay PUT y muestra mensaje (D25)", async () => {
    const user = userEvent.setup();
    policyState.current = policy();
    policyState.refetch.mockResolvedValue({
      data: undefined,
      isError: true,
      error: new Error("network"),
    });

    render(<FiscalPolicySettingsPage />);
    await user.click(screen.getByLabelText(/No permitido/i));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(
        screen.getByText("No se pudo calcular el impacto."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(policyState.mutateAsync).not.toHaveBeenCalled();
  });
});
