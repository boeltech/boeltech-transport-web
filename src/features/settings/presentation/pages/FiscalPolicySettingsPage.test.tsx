import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { formatDateTime } from "@shared/utils/dateUtils";
import type { FiscalPolicy } from "../../infrastructure/fiscalPolicyApi";
import { FiscalPolicySettingsPage } from "./FiscalPolicySettingsPage";

const policyState = vi.hoisted(() => ({
  current: null as FiscalPolicy | null,
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
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
    refetch: vi.fn(),
  }),
  useUpdateFiscalPolicy: () => ({
    mutateAsync: vi.fn(),
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
    ...overrides,
  };
}

describe("FiscalPolicySettingsPage último cambio", () => {
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
