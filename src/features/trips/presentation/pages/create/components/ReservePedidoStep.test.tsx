import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";

import { TooltipProvider } from "@shared/ui/tooltip";
import { wizardCopy } from "../../../copy";
import { ReservePedidoStep } from "./ReservePedidoStep";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "./validation";

const reserve = wizardCopy.shell.reserve;

const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

function Harness() {
  const form = useForm<TripWizardFormValues>({
    defaultValues: defaultWizardFormValues as TripWizardFormValues,
  });
  return (
    <MemoryRouter>
      <TooltipProvider delayDuration={0}>
        <ReservePedidoStep
          form={form}
          clients={[{ id: "c-1", legalName: "Cliente SA" }]}
          isLoadingClients={false}
        />
      </TooltipProvider>
    </MemoryRouter>
  );
}

describe("ReservePedidoStep client scale", () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
  });

  it("muestra Link a /clients/new si clients.create", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "clients" && action === "create",
    );
    render(<Harness />);

    expect(
      screen.getByRole("link", { name: reserve.action.newClient }),
    ).toHaveAttribute("href", "/clients/new");
    expect(
      screen.queryByText(reserve.hint.newClientEscalate),
    ).not.toBeInTheDocument();
  });

  it("oculta el alta y muestra hint de escala si !clients.create", () => {
    mockHasPermission.mockReturnValue(false);
    render(<Harness />);

    expect(
      screen.queryByRole("link", { name: reserve.action.newClient }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(reserve.hint.newClientEscalate)).toBeInTheDocument();
  });
});
